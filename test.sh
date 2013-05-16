set -ex
TODO=${TODO:-$(dirname "$0")/todo.js}
TODOLIST=$(date | md5sum | cut -d ' ' -f 1)
OUTPUT=$("${TODO}" ${TODOLIST} add foo)
echo ${OUTPUT} | egrep "[0-9]+: foo - TODO"
ID0=$(echo ${OUTPUT} | cut -d ':' -f 1 | sed -e 's/ID //')
OUTPUT=$("${TODO}" ${TODOLIST} add bar)
echo ${OUTPUT} | egrep "[0-9]+: bar - TODO"
ID1=$(echo ${OUTPUT} | cut -d ':' -f 1 | sed -e 's/ID //')
OUTPUT=$("${TODO}" ${TODOLIST} add hop)
echo ${OUTPUT} | egrep "[0-9]+: hop - TODO"
ID2=$(echo ${OUTPUT} | cut -d ':' -f 1 | sed -e 's/ID //')
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID2})
[[ "${OUTPUT_GET}" = "${OUTPUT}" ]]
OUTPUT_DEL=$("${TODO}" ${TODOLIST} del ${ID2})
[[ "${OUTPUT_DEL}" = "ID ${ID2}: DEL" ]]
! ("${TODO}" ${TODOLIST} get ${ID2})
OUTPUT_LS=$("${TODO}" ${TODOLIST} ls)
echo ${OUTPUT_LS} | egrep "[0-9]+: foo - TODO"
echo ${OUTPUT_LS} | egrep "[0-9]+: bar - TODO"
echo ${OUTPUT_LS} | egrep -v "[0-9]+: hop - TODO"
OUTPUT_DO=$("${TODO}" ${TODOLIST} edit ${ID0} foo true)
echo ${OUTPUT_DO} | egrep "[0-9]+: foo - DONE"
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID0})
[[ "${OUTPUT_GET}" = "${OUTPUT_DO}" ]]
"${TODO}" ${TODOLIST} edit ${ID1} foo true
OUTPUT_UNDO=$("${TODO}" ${TODOLIST} edit ${ID1} bar false)
echo ${OUTPUT_UNDO} | egrep "[0-9]+: bar - TODO"
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID1})
[[ "${OUTPUT_GET}" = "${OUTPUT_UNDO}" ]]
OUTPUT_EDIT=$("${TODO}" ${TODOLIST} edit ${ID1} babar false)
echo ${OUTPUT_EDIT} | egrep "[0-9]+: babar - TODO"
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID1})
[[ "${OUTPUT_GET}" = "${OUTPUT_EDIT}" ]]
OUTPUT_ARCHIVE=$("${TODO}" ${TODOLIST} archive)
[[ "${OUTPUT_ARCHIVE}" = "${ID0}: ARCHIVED" ]]
OUTPUT_LS=$("${TODO}" ${TODOLIST} ls)
echo ${OUTPUT_LS} | egrep -v "[0-9]+: foo - TODO"
echo ${OUTPUT_LS} | egrep -v "[0-9]+: bar - TODO"
echo ${OUTPUT_LS} | egrep "[0-9]+: babar - TODO"
echo ${OUTPUT_LS} | egrep -v "[0-9]+: hop - TODO"
echo "PASS"
