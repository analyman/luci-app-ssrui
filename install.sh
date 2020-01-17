#!/bin/bash

[ -z "${ROOT_DIR}" ] && ROOT_DIR="/"
[[ "${ROOT_DIR}" =~ ^.*\/$ ]] || ROOT_DIR="$ROOT_DIR/"

declare -r LUCI_INS_DIR="${ROOT_DIR}usr/lib/lua/luci"
declare -r LIST_SAVE="$PWD/installed_files"

declare -i PRINT_OUT=1
declare -i JUST_TEST=0
declare -i JUST_DELE=0
declare -i JUST_CLEAN=0
#{ handle options
#{ USAGE()
USAGE()
{
    cat <<EOF
install.sh [options]
    
    options:
      -s      suppress standard output
      -p      invert -s option (default)
      -t      don't do anything, just echo what will happen
      -r      remove previous installation, this feature depends on file ${LIST_SAVE}
      -c      clean this repository
      -h      print help
EOF
} #}

declare -A IN_OPTIONS
test_duplicated_options()
{
    if [ -n "${IN_OPTIONS[$1]}" ]; then
        echo "duplicated option '$1'"
        USAGE && exit 1
    fi
    IN_OPTIONS[$1]=1
    return 0
}

[ $# -gt 2 ] && USAGE && exit 1
while [ $# -gt 0 ]; do
    test_duplicated_options "$1"
    if [ "$1" == "-p" ]; then
        PRINT_OUT=1
    elif [ "$1" == "-s" ]; then
        PRINT_OUT=0
    elif [ "$1" == "-h" ]; then
        USAGE && exit 0
    elif [ "$1" == "-t" ]; then
        JUST_TEST=1
    elif [ "$1" == "-r" ]; then
        JUST_DELE=1
    elif [ "$1" == "-c" ]; then
        JUST_CLEAN=1
    else
        USAGE && exit 1
    fi
    shift
done

if [ ${JUST_CLEAN} -eq 1 ] && [ ${JUST_DELE} -eq 1 ]; then
    echo "conflict option '-c' and 'r'"
    exit 1
fi
#}

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
            echo -e "$MSG" | tee -a ${INF_LOG}
        else
            echo -e "$MSG" >> ${INF_LOG}
        fi
        return 0
    fi
    if [ "${PRIORITY}" == "ERROR" ]; then
        echo -e "ERROR [$(date)]: $MSG" | tee -a ${ERR_LOG}
        return 0
    else
        if [ $PRINT_OUT -eq 1 ]; then
            echo -e "${PRIORITY} [$(date)]: $MSG" | tee -a ${INF_LOG}
        else
            echo -e "${PRIORITY} [$(date)]: $MSG" >> ${INF_LOG}
        fi
        return 0
    fi
} #}

#{ function: return_with(exit_status)
return_with()
{
    if [ ! $# -eq 1 ] || [[ ! "$1" =~ [[:digit:]]* ]]; then
        __logger__ "ERROR" "return_with() called with <$1>..."
        clean_exit 1
    fi
    return $1
}
#}

# installed file list
declare -a INSTALLED_FILE_LIST
#{ function: add_to_installed_list()
add_to_installed_list()
{
    [ ! $# -eq 1 ] && return 1
    local -i list_len=${#INSTALLED_FILE_LIST[@]}
    INSTALLED_FILE_LIST[${list_len}]="$1"
}
#}

#{ function: clean_exit(exit_status)
clean_exit()
{
    [ "${START_BANNER}" == 1 ] && __logger__ "BANNER" "----------------- END $$ ------------------\n"
    if   [ $JUST_DELE -eq 1 ]; then
        true
    elif [ $JUST_CLEAN -eq 1 ]; then
        [ -f $INF_LOG ]   && rm -f $INF_LOG
        [ -f $ERR_LOG ]   && rm -f $ERR_LOG
        [ -f $LIST_SAVE ] && rm -f $LIST_SAVE
    else
        if [ $# -eq 1 ] && [ $1 -eq 0 ]; then
            [ -e ${LIST_SAVE} ] && rm -rf ${LIST_SAVE}
            touch $LIST_SAVE
            for file__ in ${INSTALLED_FILE_LIST[@]}; do
                echo $file__ >> $LIST_SAVE
            done
        else
            for file__ in ${!INSTALLED_FILE_LIST[@]}; do
                if [ $JUST_TEST -eq 0 ]; then
                    rm -f INSTALLED_FILE_LIST[$file__]
                fi
                __logger__ "WARNING" "remove file - $file__"
            done
        fi
    fi
    [ $# -eq 1 ] && exit $1
    exit 1
} #}

#{ function: exec_with_status_check(...)
exec_with_status_check()
{
    [ $# -eq 0 ] && __logger__ "WARNING" "exec_with_status_check() called with empty parameter" && return 0
    eval "$@"
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
    [ $JUST_TEST -eq 0 ] && exec_with_status_check "cp -f $src $dst" || __logger__ "INFO" "[cp -f $src $dst] success - test"
    add_to_installed_list "$dst"
    return 0
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
    [[ "$2" =~ ^.*\/$ ]] && dst_dir="$2" || dst_dir="$2/"
    local IFS=$'\n'
    for file__ in ${file_list}; do
        exec_with_status_check "cp_file_with_uncheck_dir $src_dir$file__ $dst_dir$file__"
    done
    return 0
} #}

#{ function: del_previous_installation()
del_previous_installation()
{
    if [ ! -f ${LIST_SAVE} ]; then
        __logger__ "ERROR" "file $LIST_SAVE doesn't exist"
        USAGE && clean_exit 1
    fi
    for file__ in $(cat $LIST_SAVE); do
        __logger__ "INFO" "removing file ${file__}"
        [ $JUST_TEST -eq 0 ] && exec_with_status_check "rm ${file__}" || \
            __logger__ "INFO" "[rm ${file__}] success - test"
    done
    return 0
} #}

declare -i START_BANNER=1
__logger__ "BANNER" "------------------ START $$ -------------------"

# DODODO
if [ ${JUST_DELE} -eq 1 ]; then
    del_previous_installation
elif [ ${JUST_CLEAN} -eq 1 ]; then
    echo "cleanning"
else
    install_dir_to_dir "$PWD/luci"      "$LUCI_INS_DIR/"
    install_dir_to_dir "$PWD/etc"       "${ROOT_DIR}etc"
#   install_dir_to_dir "$PWD/www"       "${ROOT_DIR}www"
    install_dir_to_dir "$PWD/asset"     "${ROOT_DIR}www/luci-static/resources/ssrui"
    install_dir_to_dir "$PWD/lua"       "${ROOT_DIR}usr/lib/lua"
    install_dir_to_dir "$PWD/translate" "${ROOT_DIR}usr/lib/lua/luci/i18n"
    [ -d $PWD/dist ] && install_dir_to_dir "$PWD/dist" "${ROOT_DIR}www/luci-static/resources/ssrui"
fi

clean_exit 0
