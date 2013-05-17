
PYGMENTIZE=html/pygmentize.py

for f in *.js; do
  echo "Processing $f file.."
  ${PYGMENTIZE} ${f} html/${f}.html
done

${PYGMENTIZE} bonus/server/rpc/todos.js html/server/rpc/todos.js.html
${PYGMENTIZE} bonus/server/rpc/solution.js html/server/rpc/solution.js.html

