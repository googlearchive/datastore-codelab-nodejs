#!/usr/bin/env python

import os
import sys

import jinja2

from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import HtmlFormatter

jinja2_environment = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

def print_usage():
  print sys.argv[0] + ' source dest [style]'

def main(argv):
  style = 'monokai'
  if len(argv) < 2:
    print_usage()
    exit(1)
  if len(argv) > 2:
    style = argv[2]
  source = argv[0]
  dest = argv[1]
  with open(source) as f:
    code = f.read()
  template = jinja2_environment.get_template('template.html')
  lexer = PythonLexer()
  formatter = HtmlFormatter(style=style)
  css = formatter.get_style_defs()
  highlighted = highlight(code, lexer, formatter)
  with open(dest, 'w') as f:
    f.write(template.render(title=source, stylesheet=css, source=highlighted))
            

if __name__ == '__main__':
  main(sys.argv[1:])
