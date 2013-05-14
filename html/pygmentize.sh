
PYGMENTIZE=html/pygmentize.py

for f in *.js; do
  echo "Processing $f file.."
  ${PYGMENTIZE} ${f} html/${f}.html
done
