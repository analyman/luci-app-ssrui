#!/bin/bash

LUCI_INS_DIR="/usr/lib/lua/luci"
PRINT_OUT=1

# log
declare -r INF_LOG="$PWD/install_out.log"
declare -r ERR_LOG="$PWD/install_err.log"
[ -e $INF_LOG ] && rm -rf $INF_LOG
[ -e $ERR_LOG ] && rm -rf $ERR_LOG
#{ logger
__logger__()
{
    local MSG
    local PRIORITY
    if [ $# -eq 1 ]; then
        MSG="$1"
        PRIORITY="INFO"
    else
        PRIORITY="$1"
        MSG="$2"
    fi
    if [ "${PRIORITY}" == "BANNER" ]; then
        if [ $PRINT_OUT -eq 1 ]; then
            echo -e "$MSG" | tee ${INF_LOG}
        else
            echo -e "$MSG" >> ${INF_LOG}
        fi
        return 0
    fi
    if [ "${PRIORITY}" == "ERROR" ]; then
        echo -e "ERROR [$(date)]: $MSG" | tee ${ERR_LOG}
        return 0
    else
        if [ $PRINT_OUT -eq 1 ]; then
            echo -e "${PRIORITY} [$(date)]: $MSG" | tee ${INF_LOG}
        else
            echo -e "${PRIORITY} [$(date)]: $MSG" >> ${INF_LOG}
        fi
        return 0
    fi
} #}

 #{ function: clean_exit(exit_status)
clean_exit()
{
    [ "${START_BANNER}" == 1 ] && __logger__ "BANNER" "----------------- END $$ ------------------\n"
    [ $# -eq 1 ] && exit $1
    exit 1
} #}

#{ function: return_with(exit_status)
return_with()
{
    if [ ! $1 -eq 1 ] || [[ ! "$1" =~ [[:digit:]]* ]]; then
        __logger__ "ERROR" "return_with() called with <$1>..."
        clean_exit 1
    fi
    return $1
}
#}

#{ function: exec_with_status_check(...)
exec_with_status_check()
{
    [ $# -eq 0] && __logger__ "WARNING" "exec_with_status_check() called with empty parameter" && return 0
    $@
    local exit_status=$?
    if [ $exit_status -eq 0 ]; then
        __logger__ "INFO" "[$@] success"
        return 0
    else
        __logger__ "ERROR" "[$@] fail, with $exit_status"
        clean_exit $exit_status
    fi
} #}
#{ function: cp_file_with_uncheck_dir(src, dst), if dst file exists, it will overwrite file
cp_file_with_uncheck_dir()
{
    [ ! $# -eq 2 ] && __logger__ "ERROR" "Invalidate parameter, when calling cp_file_with_uncheck_dir()" && \
        clean_exit 1
    local src="$1"
    local dst="$2"
    dst_dir_part=${dst%/*}
    if [ -e ${dst_dir_part} ]; then
        if [ ! -d ${dst_dir_part} ]; then
            __logger__ "ERROR" "${dst_dir_part} exists, and it isn't directory"
            clean_exit 1
        fi
    else
        exec_with_status_check "mkdir -p ${dst_dir_part}"
    fi
    exec_with_status_check "cp -f $src $dst"
} #}
#{ function: install_dir_to_dir(src, dst)
install_dir_to_dir()
{
    [ ! $# -eq 2 ] && __logger__ "ERROR" "Invalidate parameter, when calling install_dir_to_dir()" && \
        clean_exit 1
    [ ! -d $1 ] && __logger__ "ERROR" "directory $1 don't exists, exit 1" &&  clean_exit 1
    [ ! -d $2 ] && __logger__ "ERROR" "directory $2 don't exists, exit 1" &&  clean_exit 1
    local file_list=$(pushd $1 1>/dev/null 2>&1 && find . -type f  | sed 's/^\.\///g' && popd 1>/dev/null 2>&1)
    exec_with_status_check "return_with $?"
    __logger__ "from $1 to $2, file list: [$file_list]"
    local src_dir=
    local dst_dir=
    [[ "$1" =~ ^.*\/$ ]] && src_dir="$1" || src_dir="$1/"
    [[ "$2" =~ ^.*\/$ ]] && src_dir="$2" || src_dir="$2/"
    local IFS=$'\n'
    for file__ in ${file_list}; do
        cp_file_with_uncheck_dir "$src_dir$file__" "$dst_dir$file__"
    done
    return 0
} #}

install_dir_to_dir "$PWD/view/"       "$LUCI_INS_DIR/view/"
install_dir_to_dir "$PWD/controller/" "$LUCI_INS_DIR/controller/"
install_dir_to_dir "$PWD/model/"      "$LUCI_INS_DIR/model/"

clean_exit 0
