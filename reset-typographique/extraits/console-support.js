['hyphenate-limit-chars: 6 3 3', 'hyphenate-limit-lines: 2', 'hyphenate-limit-zone: 8%', 'hyphenate-limit-last: always',
 'hanging-punctuation: first', 'text-wrap: pretty', 'text-box: trim-both cap alphabetic', 'font-variant-emoji: text']
  .map(d => [d, CSS.supports(`(${d})`)])
  .concat([[':heading', CSS.supports('selector(:heading)')]])
