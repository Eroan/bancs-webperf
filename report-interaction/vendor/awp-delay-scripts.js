/**
 * AwpDelayScripts : reporte l'exécution de scripts (tiers surtout) après la première interaction,
 * ou au plus tard après un plafond, puis les injecte échelonnés, thread principal libre.
 *
 * Balisage : un script inerte (type inconnu : ni téléchargé, ni exécuté).
 *   <script type="delay/oninteraction" data-delay="2500" src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"><\/script>
 *   <script type="delay/oninteraction" data-delay="7000" data-ifdom="#contact" src="…/chat.js"><\/script>
 *   <script type="delay/oninteraction" data-minmemory="4" src="…/lourd.js"><\/script>
 *
 * - data-delay     : ms après le déclenchement (défaut 100) ; 100 ms minimum entre deux injections.
 * - data-ifdom     : sélecteur ; script ignoré si aucun élément ne correspond.
 * - data-minmemory : Go ; chargé seulement si navigator.deviceMemory >= valeur. deviceMemory
 *                    n'existe que dans Chromium : sur Firefox et Safari, ces scripts ne sont JAMAIS chargés.
 * - id             : l'événement `<id>-loaded` est émis sur document après exécution (inline) ou
 *                    chargement (externe) ; AwpDelayScripts.ready(id) renvoie une promesse, résolue
 *                    même si l'événement est déjà passé.
 *
 * Les scripts externes s'exécutent dans l'ordre d'injection ; un inline s'exécute dès son injection,
 * sans attendre un externe encore en cours : s'il en dépend, `await AwpDelayScripts.ready('<id>')`.
 * Charger ce fichier tôt (inline ou synchrone en fin de <head>) pour capter les premières interactions.
 * Les exemples ci-dessus échappent la barre de leur balise fermante : écrite telle quelle, même en
 * commentaire, elle fermerait l'élément <script> quand ce fichier est collé inline.
 */
class AwpDelayScripts {
    constructor({
        triggerEvents = ['keydown', 'mousedown', 'mousemove', 'touchmove', 'touchstart', 'touchend', 'wheel'],
        maxWait = 5000 // plafond après DOMContentLoaded, pour les visiteurs qui n'interagissent pas
    } = {}) {
        this.triggerEvents = triggerEvents;
        this.maxWait = maxWait;
        this.scriptsLoaded = false;
        this.userInteracted = false;
        this.limitReached = false;
        this.domContentLoaded = false;
        this.eventListenerRemovers = [];

        this._addUserInteractionListener();
        this._addDomContentLoadedListener();
    }

    _tryToLoad() {
        if (this.scriptsLoaded || !this.domContentLoaded || !(this.userInteracted || this.limitReached)) return;
        this.scriptsLoaded = true;
        this._removeUserInteractionListeners();
        AwpDelayScripts._whenIdle(() => this._loadDelayedScripts());
    }

    _addDomContentLoadedListener() {
        const onReady = () => {
            this.domContentLoaded = true;
            setTimeout(() => { this.limitReached = true; this._tryToLoad(); }, this.maxWait);
            this._tryToLoad(); // une interaction survenue pendant l'analyse compte dès maintenant
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady(); // fichier arrivé après DOMContentLoaded : l'événement ne viendra plus
        }
    }

    _addUserInteractionListener() {
        this.triggerEvents.forEach(event => {
            const listener = () => { this.userInteracted = true; this._tryToLoad(); };
            window.addEventListener(event, listener, { once: true, passive: true });
            this.eventListenerRemovers.push(() => window.removeEventListener(event, listener));
        });
    }

    _removeUserInteractionListeners() {
        this.eventListenerRemovers.forEach(remove => remove());
    }

    _loadDelayedScripts() {
        const delayOf = script => parseInt(script.dataset.delay, 10) || 100;
        const scripts = Array.from(document.querySelectorAll('script[type="delay/oninteraction"]'))
            .filter(script => {
                if (script.dataset.ifdom && document.querySelector(script.dataset.ifdom) === null) return false;
                if (script.dataset.minmemory) {
                    const deviceMemory = navigator.deviceMemory; // Chromium uniquement
                    return typeof deviceMemory === 'number' && deviceMemory >= parseFloat(script.dataset.minmemory);
                }
                return true;
            })
            .sort((a, b) => delayOf(a) - delayOf(b));

        let lastInjectionTime = 0;
        scripts.forEach(script => {
            const actualDelay = Math.max(delayOf(script), lastInjectionTime + 100);
            lastInjectionTime = actualDelay;
            if (script.src) this._preloadScript(script);
            setTimeout(() => AwpDelayScripts._whenIdle(() => this._injectScript(script)), actualDelay);
        });
    }

    _preloadScript(script) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = script.src;
        link.fetchPriority = 'low';
        const crossOrigin = script.getAttribute('crossorigin');
        if (crossOrigin !== null) link.crossOrigin = crossOrigin; // même mode que le script, sinon préchargement perdu
        if (script.integrity) link.integrity = script.integrity;
        if (script.nonce) link.nonce = script.nonce;
        document.head.appendChild(link);
    }

    _injectScript(script) {
        const newScript = document.createElement('script');
        const skip = ['type', 'data-delay', 'data-ifdom', 'data-minmemory'];
        Array.from(script.attributes).forEach(attr => {
            if (!skip.includes(attr.name)) newScript.setAttribute(attr.name, attr.value);
        });
        // L'attribut nonce est masqué (vidé) après l'analyse : seule la propriété garde la valeur,
        // sans quoi une CSP à nonce bloque le script recréé.
        if (script.nonce) newScript.nonce = script.nonce;
        newScript.fetchPriority = 'low';

        const id = script.id;
        if (script.src) {
            newScript.async = false; // externes exécutés dans l'ordre d'injection, pas d'arrivée
            if (id) newScript.addEventListener('load', () => AwpDelayScripts._signal(id));
            script.replaceWith(newScript);
        } else {
            newScript.textContent = script.textContent;
            script.replaceWith(newScript); // un inline s'exécute pendant l'insertion
            if (id) AwpDelayScripts._signal(id); // émis par le chargeur, sans modifier le code du script
        }
    }

    static _whenIdle(fn) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(fn, { timeout: 2000 }); // plafond si le thread principal reste occupé
        } else {
            setTimeout(fn, 0); // Safari : pas de requestIdleCallback
        }
    }

    static _signal(id) {
        AwpDelayScripts._done.add(id);
        document.dispatchEvent(new CustomEvent(`${id}-loaded`));
    }

    /** Promesse résolue quand le script d'id donné a été exécuté, même si c'était avant l'appel. */
    static ready(id) {
        if (AwpDelayScripts._done.has(id)) return Promise.resolve();
        return new Promise(resolve => document.addEventListener(`${id}-loaded`, () => resolve(), { once: true }));
    }

    static run(options) {
        return new AwpDelayScripts(options);
    }
}
AwpDelayScripts._done = new Set();

AwpDelayScripts.run();
