#!/bin/bash

set -e

OLD_VERSION=$(cat .version)

NOW=`date +%Y%m%d%H%M%S`
SHA=$(git rev-parse --short HEAD)
NEW_VERSION="latest-${SHA}-${NOW}"

if [[ "$OLD_VERSION" != "$NEW_VERSION" ]]; then
    echo -n $NEW_VERSION > .version
    echo  "$NEW_VERSION > .version"
else
    echo  "$NEW_VERSION == .version"
fi

git add .version && git commit -m "ci($NEW_VERSION): ✨🐛🚨"

TARGET=${1:-origin}
echo -e "\n---------------------------"
echo -e "Pushing... $NEW_VERSION --> $TARGET"
echo -e "---------------------------\n"
git push $TARGET
