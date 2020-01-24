#!/usr/bin/env bash

USAGE()
{
    echo "USAGE:" >&2
    echo "       $0 <server> <server_port>" >&2
    return 0
}

[ ! $# -eq 2 ] && USAGE && exit 1

netcat_test()
{
    local nc_output=$(nc -w 2 -zv $1 $2)
    local save_status=$?
    echo "$nc_output"
    return $save_status
}

ping_test()
{
    local ping_output=$(ping -W 2 -c 4 $1)
    local save_status=$?
    echo "$ping_output"
    return $save_status
}

if [ -x "$(which ping)" ]; then
    echo "PING test:"
    ping_test $1
fi

if [ -x "$(which netcat)" ]; then
    echo -e "\n\nNETCAT test:"
    netcat_test $1 $2
fi

