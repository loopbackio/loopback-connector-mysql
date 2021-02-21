### PowerShell script to spin up a docker container for MySQL.

## variables
$MYSQL_CONTAINER="mysql_c"
$MYSQL_HOST="localhost"
$MYSQL_USER="root"
$MYSQL_PASSWORD="pass"
$MYSQL_PORT=3306
$MYSQL_DATABASE="testdb"

if ($args[0]){
  $MYSQL_HOST=$args[0]
}
if ($args[1]){
  $MYSQL_PORT=$args[1]
}
if ($args[2]){
  $MYSQL_USER=$args[2]
}
if ($args[3]){
  $MYSQL_PASSWORD=$args[3]
}
if ($args[4]){
  $MYSQL_DATABASE=$args[4]
}

## check if docker exists
Write-Host ">> Checking for docker" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green

try {
  docker -v 
}
catch {
  Write-Host "`r`nStatus: " -ForegroundColor Cyan -NoNewline
  Write-Host "Docker not found. Terminating setup.`r`n" -ForegroundColor Red
  exit 1
}

Write-Host "Found docker. Moving on with the setup." -ForegroundColor Cyan

## cleaning up previous builds
Write-Host ">> Finding old builds and cleaning up" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green
docker rm -f $MYSQL_CONTAINER 2>&1>$null

## variables needed to health check docker daemon
$OUTPUT=$LASTEXITCODE
$TIMEOUT=120
$TIME_PASSED=0
$WAIT_STRING="."

if($OUTPUT -ne 0) {    
  ## starting docker daemon
  Write-Host ">> Starting docker daemon" -ForegroundColor Red -NoNewline
  Write-Host " ..." -ForegroundColor Green

  Start-Job -ScriptBlock { Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Minimized } 2>&1>$null       

  Write-Host "Waiting for docker daemon to respond $WAIT_STRING" -ForegroundColor Green -NoNewline
  while ($OUTPUT -ne 0 -and $TIMEOUT -gt 0) {
    docker rm -f $MYSQL_CONTAINER 2>&1>$null
    $OUTPUT=$LASTEXITCODE
    Start-Sleep -s 1
    $TIMEOUT=$(($TIMEOUT - 1))
    $TIME_PASSED=$(($TIME_PASSED + 1))

    if ($TIME_PASSED -eq 1) {
      Write-Host $WAIT_STRING -ForegroundColor Green -NoNewline
      $TIME_PASSED=0
    }
    
  }

  Write-Host $WAIT_STRING -ForegroundColor Green
  Write-Host "Docker daemon is running." -ForegroundColor Cyan    
}

if ($TIMEOUT -le 0){
  Write-Host "`r`nStatus: " -ForegroundColor Cyan -NoNewline
  Write-Host "Failed to start docker daemon. Terminating setup.`r`n" -ForegroundColor Red
  exit 1
}
Write-Host "Clean up complete." -ForegroundColor Cyan

## Pin mysql docker image to version as `mysql` node.js driver does not support v8 yet
## See https://github.com/mysqljs/mysql/issues/2002
$DOCKER_IMAGE='mysql:5.7.22'

## pull latest mysql image
Write-Host ">> Pulling ${DOCKER_IMAGE} image" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green

docker pull ${DOCKER_IMAGE} 
Write-Host "Image successfully built." -ForegroundColor Cyan

## run the mysql container
Write-Host ">> Starting the mysql container" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green
$CONTAINER_STATUS=$(docker run --name $MYSQL_CONTAINER -e MYSQL_ROOT_USER=$MYSQL_USER -e MYSQL_ROOT_PASSWORD=$MYSQL_PASSWORD -p ${MYSQL_PORT}:${MYSQL_PORT} -d ${DOCKER_IMAGE} )
Write-Host $CONTAINER_STATUS
if ($CONTAINER_STATUS -like "*Error*") {
  Write-Host "`r`nStatus: " -ForegroundColor Cyan -NoNewline
  Write-Host "Error starting container. Terminating setup.`r`n" -ForegroundColor Red
  exit 1
}
docker cp .\test\schema.sql ${MYSQL_CONTAINER}:/home/ 
Write-Host "Container is up and running." -ForegroundColor Cyan

## export the schema to the mysql database
Write-Host ">> Exporting default schema" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green

## command to export schema
docker exec -it $MYSQL_CONTAINER /bin/sh -c "mysql -u$MYSQL_USER -p$MYSQL_PASSWORD < /home/schema.sql" 2>&1>$null

## variables needed to health check export schema
$OUTPUT=$LASTEXITCODE
$TIMEOUT=120
$TIME_PASSED=0

Write-Host "Waiting for mysql to respond with updated schema $WAIT_STRING" -ForegroundColor Green -NoNewline
while ($OUTPUT -ne 0 -and $TIMEOUT -gt 0) {
  docker exec -it $MYSQL_CONTAINER /bin/sh -c "mysql -u$MYSQL_USER -p$MYSQL_PASSWORD < /home/schema.sql" 2>&1>$null
  $OUTPUT=$LASTEXITCODE
  Start-Sleep -s 1
  $TIMEOUT=$(($TIMEOUT - 1))
  $TIME_PASSED=$(($TIME_PASSED + 1))

  if ($TIME_PASSED -eq 1) {
    Write-Host $WAIT_STRING -ForegroundColor Green -NoNewline
    $TIME_PASSED=0
  }
    
}

Write-Host $WAIT_STRING -ForegroundColor Green

if ($TIMEOUT -le 0){
  Write-Host "`r`nStatus: " -ForegroundColor Cyan -NoNewline
  Write-Host "Failed to export schema. Terminating setup.`r`n" -ForegroundColor Red
  exit 1
}
Write-Host "Successfully exported schema to database." -ForegroundColor Cyan

## create the database
Write-Host ">> Creating the database" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green
docker exec -it $MYSQL_CONTAINER /bin/sh -c "mysql -u$MYSQL_USER -p$MYSQL_PASSWORD -e 'DROP DATABASE IF EXISTS $MYSQL_DATABASE'" 2>&1>$null
docker exec -it $MYSQL_CONTAINER /bin/sh -c "mysql -u$MYSQL_USER -p$MYSQL_PASSWORD -e 'CREATE DATABASE $MYSQL_DATABASE'" 2>&1>$null
$DATABASE_CREATED=$LASTEXITCODE
if($DATABASE_CREATED -ne 0){
  Write-Host "`r`nStatus: " -ForegroundColor Cyan -NoNewline
  Write-Host "Database could not be created. Terminating setup.`r`n" -ForegroundColor Red
  exit 1
}
Write-Host "Successfully created the database." -ForegroundColor Cyan

## set env variables for running test
Write-Host ">> Setting env variables to run test" -ForegroundColor Red -NoNewline
Write-Host " ..." -ForegroundColor Green
$Env:MYSQL_HOST = $MYSQL_HOST
$Env:MYSQL_PORT = $MYSQL_PORT
$Env:MYSQL_USER = $MYSQL_USER
$Env:MYSQL_PASSWORD = $MYSQL_PASSWORD
$Env:MYSQL_DATABASE = $MYSQL_DATABASE
Write-Host "Env variables set." -ForegroundColor Cyan

Write-Host "Status: " -ForegroundColor Cyan -NoNewline
Write-Host "Set up completed successfully." -ForegroundColor Green
Write-Host "Instance url: " -ForegroundColor Cyan -NoNewline
Write-Host "mysql://${MYSQL_USER}:$MYSQL_PASSWORD@$MYSQL_HOST/$MYSQL_DATABASE" -ForegroundColor Yellow
Write-Host "To run the test suite: " -ForegroundColor Cyan -NoNewline
Write-Host "npm test`r`n" -ForegroundColor Yellow