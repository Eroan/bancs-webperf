#!/usr/bin/env python3
"""Régénère les images de la page de banc (Pillow). Images ÉQUIVALENTES (dimensions, poids voisin),
pas identiques à l'octet : l'encodeur WebP varie d'une version de Pillow à l'autre. Les images
de la série de référence sont celles du dépôt (site/img/).
Usage : python3 site/generer-images.py
"""
import os, random
from PIL import Image, ImageDraw, ImageFilter

ICI = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'img')
random.seed(42)


def image(w, h, teinte):
    im = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(im)
    for y in range(h):
        d.line([(0, y), (w, y)], fill=(int(40 + teinte * 0.5 + y * 120 / h) % 256, int(80 + y * 90 / h) % 256, int(140 + teinte) % 256))
    for _ in range(140):
        x, y, r = random.randint(0, w), random.randint(0, h), random.randint(8, 90)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
    return im.filter(ImageFilter.GaussianBlur(1.2))


# image principale (LCP) : bruitée pour peser ~50 Ko en 720 × 450
hero = image(800, 500, 30)
px = hero.load()
random.seed(7)
for _ in range(int(800 * 500 * 0.6)):
    x, y = random.randrange(800), random.randrange(500)
    n = random.randint(-40, 40)
    px[x, y] = tuple(max(0, min(255, c + n)) for c in px[x, y])
hero.resize((720, 450)).save(os.path.join(ICI, 'hero.webp'), 'WEBP', quality=40)
for i in range(1, 6):
    image(600, 400, 20 * i).save(os.path.join(ICI, f'slide{i}.webp'), 'WEBP', quality=72)
for i in range(1, 5):
    image(1000, 667, 35 * i).save(os.path.join(ICI, f'photo{i}.webp'), 'WEBP', quality=72)
for f in sorted(os.listdir(ICI)):
    print(f, os.path.getsize(os.path.join(ICI, f)))
