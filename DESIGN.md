Se eligio node por su facilidad a la hroa de crear servicios rest con websocket y por experinecia con el stack 

Iniciamos el proyecot con 
npm init -y

Y usaremos express ademas de dotenv para las variables de entorno
npm install express pg ws dotenv

Instalamos nodemon para tener agilidad al hacer cambios
npm install --save-dev nodemon

Usare una estructura limpia para las carpetas un modelo estandar utilizando los comandos

mkdir src
mkdir src/routes src/controllers src/models src/services src/utils src/middlewares
touch src/index.js


Usaremos base de datos de supabse que e spostgress para ello instalamos 

npm install postgres

y seguimso las instrucciones de conexion de supabase