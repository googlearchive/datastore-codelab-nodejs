set -ex
TODO=${TODO:-$(dirname "$0")/todo.js}
TODOLIST=$(date | md5sum | cut -d ' ' -f 1)
OUTPUT=$("${TODO}" ${TODOLIST} add foo)
echo ${OUTPUT} | egrep "[0-9]+: TODO foo"
ID0=$(echo ${OUTPUT} | cut -d ':' -f 1)
OUTPUT=$("${TODO}" ${TODOLIST} add bar)
echo ${OUTPUT} | egrep "[0-9]+: TODO bar"
ID1=$(echo ${OUTPUT} | cut -d ':' -f 1)
OUTPUT=$("${TODO}" ${TODOLIST} add hop)
echo ${OUTPUT} | egrep "[0-9]+: TODO hop"
ID2=$(echo ${OUTPUT} | cut -d ':' -f 1)
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID2})
[[ "${OUTPUT_GET}" = "${OUTPUT}" ]]
OUTPUT_DEL=$("${TODO}" ${TODOLIST} del ${ID2})
[[ "${OUTPUT_DEL}" = "${ID2}: DEL" ]]
! ("${TODO}" ${TODOLIST} get ${ID})
OUTPUT_LS=$("${TODO}" ${TODOLIST} ls)
echo ${OUTPUT_LS} | egrep "[0-9]+: TODO foo"
echo ${OUTPUT_LS} | egrep "[0-9]+: TODO bar"
echo ${OUTPUT_LS} | egrep -v "[0-9]+: TODO hop"
OUTPUT_DO=$("${TODO}" ${TODOLIST} do ${ID0})
echo ${OUTPUT_DO} | egrep "[0-9]+: DONE foo"
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID0})
[[ "${OUTPUT_GET}" = "${OUTPUT_DO}" ]]
"${TODO}" ${TODOLIST} do ${ID1}
OUTPUT_UNDO=$("${TODO}" ${TODOLIST} undo ${ID1})
echo ${OUTPUT_UNDO} | egrep "[0-9]+: TODO bar"
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID1})
[[ "${OUTPUT_GET}" = "${OUTPUT_UNDO}" ]]
OUTPUT_EDIT=$("${TODO}" ${TODOLIST} edit ${ID1} babar false)
echo ${OUTPUT_EDIT} | egrep "[0-9]+: TODO babar"
OUTPUT_GET=$("${TODO}" ${TODOLIST} get ${ID1})
[[ "${OUTPUT_GET}" = "${OUTPUT_EDIT}" ]]
OUTPUT_ARCHIVE=$("${TODO}" ${TODOLIST} archive)
[[ "${OUTPUT_ARCHIVE}" = "${ID0}: DEL" ]]
OUTPUT_LS=$("${TODO}" ${TODOLIST} ls)
echo ${OUTPUT_LS} | egrep -v "[0-9]+: TODO foo"
echo ${OUTPUT_LS} | egrep -v "[0-9]+: TODO bar"
echo ${OUTPUT_LS} | egrep "[0-9]+: TODO babar"
echo ${OUTPUT_LS} | egrep -v "[0-9]+: TODO hop"
echo "PASS"