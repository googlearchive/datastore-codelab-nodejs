
PYGMENTIZE=pygmentize-2.7

for f in *.js; do
  echo "Processing $f file.."
  echo '<link rel="stylesheet" href="syntax.css" type="text/css" />' > html/${f}.html
  ${PYGMENTIZE} -O style=colorful,linenos=1 -f html -l js ${f} >> html/${f}.html
done
