#!/bin/bash
# This script generates the API client code using OpenAPI Generator.
# download the latest version of the apple app store connect api schema.
# https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip
set -xe
# GitHub Actions sets RUNNER_TEMP, local dev fallback to cwd/tmp
temp_dir=${RUNNER_TEMP:-./tmp}

if [ -z "$temp_dir" ]; then
    echo "Error: temp_dir is not set"
    exit 1
fi

echo "Using temp_dir: $temp_dir"

if [ ! -d "$temp_dir" ]; then
    mkdir -p "$temp_dir"
fi

curl -L https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip -o "${temp_dir}/app-store-connect-openapi-specification.zip"
unzip "${temp_dir}/app-store-connect-openapi-specification.zip" -d "${temp_dir}/app-store-connect-openapi-specification"
# find first *.json file in the directory
schemaPath=$(find "${temp_dir}/app-store-connect-openapi-specification" -type f -name "*.json" ! -name '._*' | head -n 1)
cp "$schemaPath" app_store_connect_api_openapi.json
rm -rf "${temp_dir}/app-store-connect-openapi-specification.zip"
rm -rf "${temp_dir}/app-store-connect-openapi-specification"
rm -rf "$schemaPath"
# get the last version of the package from the npm registry
lastVersion=$(npm show @rage-against-the-pixel/app-store-connect-api version)
# set the package version to be the same as the schema version
version=$(node -p "require('./app_store_connect_api_openapi.json').info.version")
# normalize 'version' to be semver compliant (e.g. 1.0 -> 1.0.0)
version=$(npx semver "${version}" --coerce)
echo "Last version: ${lastVersion}"
# if the schema version is the same as the last version of the package, exit
echo "${lastVersion} -> ${version}"
# if the version is less than or equal to the last version, exit
if npx semver "${version}" -r "<=${lastVersion}"; then
    echo "No changes detected"
    exit 0
else
    echo "New version detected"
fi

npm version "${version}" --no-git-tag-version --allow-same-version

if ! npm run generate; then
    echo "Error: npm run generate failed"
    exit 1
fi