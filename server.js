//***************************************************** Setup de eventos a escuchar
require('events').EventEmitter.defaultMaxListeners = 20
//***************************************************** HTTPS server setup
//-----* Express inicia servidor / carpeta raiz
//------------------------------------Express inicia servidor 
const express = require('express')
let heatsink
let arrayconversion = []
const app = express()
const fs = require('fs')
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
//let clientesConectados = [];
//const ImageDataURI = require('image-data-uri')
app.use(express.static(__dirname))//Carpeta de donde sirve / carpeta raiz public

const server = app.listen(8888, () => {
	console.log('Servidor web iniciado')
})

//-----* Filesystem module object
var fss = require('fs')
//-----* https module object
var https = require('http')

//*--------------------------------TCP/IP PLC --------------------------------------------*/

var io = require('socket.io')(server); //Bind socket.io to our express server.


io.on('connection', (socket) => {//Un Socket para todos los requerimientos a postgres

	socket.on('picsaving', async function (dataURI, step, sn) { await savingpic(dataURI, step, sn); })
	/*-socket.on('picsaving2',async function(dataURI,serial,sqty){
		await savingpic2(dataURI,serial,sqty)*/
	
	socket.on('plc_response', function (result_matrix) { plcdatasender(result_matrix)/*console.log("soy result matrix: " + result_matrix)*/ });
	socket.on('logsaving', async function (logarray, serial) {/*console.log('estoy en logsaving')*/await savinglog(logarray, serial) });
	//socket renombrar carpeta
	socket.on('renombrasnr', async function (serial) { await renombraF(serial) });
	socket.on('pass42Q', async function (serialnumber, boxpoint) { await pass(serialnumber, boxpoint) })
	socket.on('fail42Q', async function (serialnumber, boxpoint) { console.log("Contactado fail"); await fail(serialnumber, boxpoint) })
	socket.on('validation42Q', async function (serialnumber, csn) { console.log("Contactado validacion"); return a = await validation(serialnumber, csn) })
	socket.on('workstation', function (serialnumber) { console.log("Contactado workstation"); workstation(serialnumber) })
	socket.on('picsavingpruebas',async function(datauri,point,sn){await savingpicpruebas(datauri,point,sn);console.log("recibe: "+point)})

});//Close io.on

//************************************************************** Server, espera algun dato de plc para arranque de secuencia  */

var net = require('net')
var tcpipserver = net.createServer(function (connection) {
	console.log('TCP client connected');
	connection.write('Handshake ok!\n'); //cuando se conecte el server, manda este mensaje ---
	connection.on('data', function (data) {
		io.emit('Sequence_start', data.toString()); console.log("Analisis in process...");

		//Responde a PLC cuando termine inspeccion
		setTimeout(function respuesta() {
			estadoconexion = connection.readyState
			console.log("Comunicacion con el plc :" + connection.readyState)

			if (estadoconexion == 'closed') {
				console.log("Puerto de PLC cerrado reintento en 1min...")
			}
			if (estadoconexion == 'open') {
				connection.write(plc_endresponse)
			}

		}, 2000)
	})
})

function plcdatasender(responsevalue) {
	if (responsevalue) {
		matrixtostring = responsevalue.toString();
		plc_endresponse = matrixtostring;
		console.log("Cadena Nueva: ", responsevalue);

		clientesConectados.forEach((socket) => {
			let estadoconexion = socket.readyState;
			console.log("Comunicacion con el plc :" + estadoconexion);

			if (estadoconexion == 'closed') {
				console.log("Puerto de PLC cerrado reintento en 1min...");
			}
			if (estadoconexion == 'open') {
				socket.write(plc_endresponse);
			}
		});
	} else {
		console.error("responsevalue is null or undefined.");
	}
}
tcpipserver.listen(40000, function () {
	console.log('PLC Port 40000 listening...');
})
//-----* Guarda imagen desde URI
async function savingpic(datauri, step, sn) {
	//let serialCorto = sn.slice(20,36)
	const ImageDataURI = require('image-data-uri');
	const fs = require('fs');
	return new Promise(async (resolve, reject) => {
		try {
			let filePath = 'C:/Users/gdl3_mds/myapp/FILTER/filter/samples/' + sn;
			let filevalidation = fs.existsSync(filePath);

			if (!filevalidation) {
				await fs.promises.mkdir(filePath);
				console.log(`Directorio creado en ${filePath}`);
			}

			filePath += '/' + step;
			await ImageDataURI.outputFile(datauri, filePath);
			console.log(`Imagen guardada en ${filePath}`);

			resolve();
		} catch (error) {
			console.error("Error al guardar la imagen: " + error.message);
			reject(error);
		}
	});
}

async function savingpicpruebas(datauri,point,sn){
	const ImageDataURI = require('image-data-uri');
	const fs = require('fs');
	return new Promise(async (resolve, reject) => {
		try {
			let filePath = 'C:/Users/gdl3_mds/myapp/FILTER/filter/samples-recortes/' + point+'';
			let filevalidation = fs.existsSync(filePath);

			if (!filevalidation) {
				await fs.promises.mkdir(filePath);
				console.log(`Directorio creado en ${filePath}`);
			}

			filePath += '/' + sn;
			await ImageDataURI.outputFile(datauri, filePath);
			console.log(`Imagen guardada en ${filePath}`);

			resolve();
		} catch (error) {
			console.error("Error al guardar la imagen: " + error.message);
			reject(error);
		}
	});

}

//-----* Guarda imagen desde URI
/*async function savingpic2(datauri, serial,step) {
	let filePath;
	const ImageDataURI = require('image-data-uri')
	return new Promise(async resolve =>{
		let random = parseInt(Math.random()*200)
		let filePath = 'C:/Users/gdl3_mds/myapp/FILTER/filter/samples-recortes/'+step+'';
		let filevalidation = fs.existsSync(filePath);
		if(filevalidation){
			filePath = ''+filePath+'/'+random+'';
			ImageDataURI.outputFile(datauri,filePath).then(res=>console.log(res));
		}
		else{
			fs.mkdir(filePath,(error)=>{
				if(error){
					console.log(error.message);
				}
				filePath=''+filePath+'/'+random+'';
				ImageDataURI.outputFile(datauri,filePath).then(res=>console.log(res))
				console.log("Directorio creado")
			});
		}
	})
}*/

/*Guarda el log*/
async function savinglog(logarray, serial) {
	return new Promise(async resolve => {

		console.log("estoy dentro de savinglog")
		let logpath = 'C:/Users/gdl3_mds/myapp/FILTER/filter/samples/' + serial + '/log.txt';
		//console.log("estoy en logsaving", logpath, serial)
		fs.writeFile(logpath, logarray, function (err) {
			if (err) throw err;

		});
		resolve('resolved')
	})
}
async function renombraF(serial) {
	return new Promise(async resolve => {
		try {
			fs.rename('C:/Users/gdl3_mds/myapp/FILTER/filter/samples/' + serial,
				'C:/Users/gdl3_mds/myapp/FILTER/filter/samples/' + serial + '_F',
				function (err) {
					if (err)
						console.log("exitosamente guardada!!");
				})
		}
		catch {
			console.log('Error de renombramiento')
		};
		resolve('resolved')
	});


}

//***************************************************************************************----- 42Q
async function conversion(arraystatus) {
	arraystatus.forEach((status, index) => {
		arrayconversion[index] = status === 1 ? "PASS" : "FAIL";
	});
	return arrayconversion;
}

//FUNCION PASS
async function pass(sn, boxpoint) {
	return new Promise(async resolve => {
		var net = require('net')
		var PORT = 50000
		var HOST = '148.164.96.7'

		await conversion(boxpoint)
		console.log("Pass:" + arrayconversion)
		var myJSON = "2" + "&" + "Tokito Final Audit" + "&" + "" + sn + "" + "&" + "Tokito-V1" + "&" + "Tesla-Tokito" + "&" + "NA" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[1] + "&" + "P1" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[2] + "&" + "P2" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[3] + "&" + "P3" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[4] + "&" + "P4" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[5] + "&" + "P5" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[6] + "&" + "P6" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[7] + "&" + "P7" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[8] + "&" + "P8" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[9] + "&" + "P9" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[10] + "&" + "P10" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[11] + "&" + "P11" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[12] + "&" + "P12" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[13] + "&" + "P13" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[14] + "&" + "P14" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[15] + "&" + "P15" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[16] + "&" + "P16" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[17] + "&" + "P17" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[18] + "&" + "Heatsink" + "&" + "1"
		//"2"+"&"+"Tokito Final Audit"+"&"+""+sn+""+"&"+"Tokito-V1"+"&"+"Tesla-Tokito"+"&"+"NA"+"&"+"PASS"+"&"+"P1"+"&"+""+boxpoint[1]+""+"&"+"P2"+"&"+""+boxpoint[2]+""+"&"+"P3"+"&"+""+boxpoint[3]+""+"&"+"P4"+"&"+""+boxpoint[4]+""+"&"+"P5"+"&"+""+boxpoint[5]+""+"&"+"P6"+"&"+""+boxpoint[6]+""+"&"+"P7"+"&"+""+boxpoint[7]+""+"&"+"P8"+"&"+""+boxpoint[8]+""+"&"+"P9"+"&"+""+boxpoint[9]+""+"&"+"P10"+"&"+""+boxpoint[10]+""+"&"+"P11"+"&"+""+boxpoint[11]+""+"&"+"P12"+"&"+""+boxpoint[12]+""+"&"+"P13"+"&"+""+boxpoint[13]+""+"&"+"P14"+"&"+""+boxpoint[14]+""+"&"+"P15"+"&"+""+boxpoint[15]+""+"&"+"P16"+"&"+""+boxpoint[16]+""+"&"+"P17"+"&"+""+boxpoint[17]+""+"&"+"heatsink"+"&"+""+boxpoint[18]+""
		var client = net.connect(PORT, HOST, function () { //'connect' listener
			console.log(myJSON)
			client.write(myJSON)
			setTimeout(function findesesion() { client.end(); }, 500)
		})
		resolve('resolved')
	})
}

//FUNCION FAIL
async function fail(sn, boxpoint, validation) {
	return new Promise(async resolve => {
		var net = require('net')
		var PORT = 50000
		var HOST = '148.164.96.7'

		await conversion(boxpoint)
		console.log("Fail:" + arrayconversion)
		var myJSON = "2" + "&" + "Tokito Final Audit" + "&" + "" + sn + "" + "&" + "Tokito-V1" + "&" + "Tesla-Tokito" + "&" + "NA" + "&" + "0" + "$" + "NA" + "&" + arrayconversion[1] + "&" + "P1" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[2] + "&" + "P2" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[3] + "&" + "P3" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[4] + "&" + "P4" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[5] + "&" + "P5" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[6] + "&" + "P6" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[7] + "&" + "P7" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[8] + "&" + "P8" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[9] + "&" + "P9" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[10] + "&" + "P10" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[11] + "&" + "P11" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[12] + "&" + "P12" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[13] + "&" + "P13" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[14] + "&" + "P14" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[15] + "&" + "P15" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[16] + "&" + "P16" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[17] + "&" + "P17" + "&" + "1" + "$" + "NA" + "&" + arrayconversion[18] + "&" + "Heatsink" + "&" + "1"
		console.log(myJSON)
		var client = net.connect(PORT, HOST, function () { //'connect' listener
			console.log(myJSON)
			client.write(myJSON)
			setTimeout(function findesesion() { client.end(); }, 500)
		})
		resolve('resolved')
	})

}
async function validation(sn, csn) {
	return new Promise(async resolve => {
		var net = require('net')
		var PORT = 50000
		var HOST = '148.164.96.7'
		var myJSON = "F" + "&" + "Tokito Final Audit" + "&" + "" + sn + "" + "&" + "NA" + "&" + "Tesla-Tokito" + "&" + "tokito-V1" + "&" + "NA" + "&" + "NA" + "&" + "NA" + "&" + "NA" + "&" + "NA" + "&" + "0"
		console.log(myJSON)
		var client = net.connect(PORT, HOST, async function () { //'connect' listener
			console.log(myJSON)
			client.write(myJSON)
			client.on('data', async function (data) {
				let Cdata = data.toString()
				console.log('Datos recibidos:', csn, Cdata.slice(26, 55), csn == Cdata.slice(26, 55));
				if (Cdata.slice(26, 55) == csn) {
					console.log('buen cover')
					io.emit('heatsink', 1)
					await sleep(300)

					await writing('1@', sn)
					await sleep(300)


				}
				else {
					console.log('mal cover')
					io.emit('heatsink', 0)
					await sleep(300)
					await writing('1@', sn)
					await sleep(300)

				}
				client.end();

			});

		})
		resolve('resolved')
	})

}

//FUNCION WORKSTATION
function workstation(serialnumber, pjct, unitnumber) {

	let sn = serialnumber;
	let projectname = pjct
	let unit = unitnumber
	console.log(sn);
	// Build the post string from an object
	let res;
	var post_data = {
		"projectname": "" + projectname + "",
		"unit": "" + unit + "",
		"employee_number": "TST99999",
		"password": "",

	};

	var myJSON = JSON.stringify(post_data);
	//console.log(" Asi es como manda la peticion al servidor: "+myJSON+"\n");

	// An object of options to indicate where to post to 
	var post_options = {
		host: '148.164.96.7',
		port: '8080',

		//--------------------------------------Sfdcpc---/numero de serie de la unidad
		path: '/Aquiles_Back/infoSerial/summary/p2448dc5/' + sn + '',
		method: 'GET',
		headers: { 'Content-type': 'application/json' }
	};

	let data = '';
	let json;
	// Set up the request object
	var post_req = http.request(post_options, function (chunk) {
		// Collect all chunks in data
		chunk.on('data', function (response) {
			data += response;
		});
	});
	setTimeout(function espera() { io.emit('workstationresponse', data) }, 1000);
	// post the data
	post_req.write(myJSON);
	post_req.end();

}

