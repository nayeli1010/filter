const express = require('express')
const app = express()

app.use(express.static(__dirname))//Carpeta de donde sirve / carpeta raiz public

const fs = require("fs");
// const path = require("path");
const server = app.listen(8888, () => {
	console.log('Servidor web iniciado')
})
const io = require('socket.io')(server);
io.on('connection',(socket) =>{
    socket.on('recorte',async function (datauri,rutaRecorte){
		console.log("Recorte")
        await recorte(datauri,rutaRecorte)
    })
})

async function recorte(datauri,rutaRecorte) {
    const ImageDataURI = require('image-data-uri');
	return new Promise(async (resolve, reject) => {
		try {
			let filePath = rutaRecorte
			let filevalidation = fs.existsSync(filePath);
			console.log(filevalidation)

			// if (!filevalidation) {
			// 	await fs.promises.mkdir(filePath);
			// 	console.log(`Directorio creado en ${filePath}`);
			// }

			// filePath += '/' + sn;
			await ImageDataURI.outputFile(datauri, filePath);
			console.log(`Imagen guardada en ${filePath}`);

			resolve('resolved');
		} catch (error) {
			console.error("Error al guardar la imagen: " + error.message);
			reject(error);
		}
	});
}