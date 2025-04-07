"use strict"

// const { model } = require("@tensorflow/tfjs")

//nombre de la imagen
let sample = "1"
let serialvalidation
let serial = "1234"
let ubicacion
let statusf = 0
let statusp = 0
let statusfinal
let resulstatus
let pass1
let fail1
let coords = {
    x: null,
    y: null,
    height: null,
    width: null
}
let statusPuntos = []
let boxpoint = []
let pn = 'LFTM113558-54-A' //'LFTM113558-16-B'
let serialCorto

//**************************DECLARACION DE MODELOS

//*****Modelos de segmentacion ******/
let segmentationModels = []
let segmentacionModel16A = new cvstfjs.ObjectDetectionModel()
segmentacionModel16A = './modelmcla/segmentacion-old/P5/model.json'

//*****Modelos de clasificacion ******/ 
let clasificationModels = []



//*************************CARGAR MODELOS */
//Cargar modelo al iniciar la pagina 
let puntosModel = [6, 1, 5, 1]
async function loadmodel() {
    let rutaSegmentacion = null, rutaClasificacion = null
    for (let i = 1; i <= 4; i++) {
        let classModel = new cvstfjs.ClassificationModel()
        let segModel = new cvstfjs.ObjectDetectionModel()
        let AClassModel = []
        let ASegModel = []
        for (let j = 1; j <= puntosModel[i-1];j++){
            AClassModel.push(classModel)
            ASegModel.push(segModel)

            rutaSegmentacion = './modelmcla/segmentacion-old/P' + i +'-' + j + '/model.json'
            rutaClasificacion = './modelmcla/clasificacion/P' + i +'-' + j + '/model.json'
            await ASegModel[j-1].loadModelAsync(rutaSegmentacion)
            await AClassModel[j-1].loadModelAsync(rutaClasificacion)

        }
        segmentationModels.push(ASegModel)
        clasificationModels.push(AClassModel)

    }

    // console.log(segmentationModels)
    // console.log(clasificationModels)

}

loadmodel()
//Variable camid para las camaras
let camid
var contenido

/************************************************ canva de la imagen a guardar */
let fullimage = document.getElementById('CanvasFHD')
let fullimagectx = fullimage.getContext('2d')
let tarjeta2 = document.getElementsByClassName('tarjeta2') //canvas donde se pondra la imagen original
let tarjeta = document.getElementsByClassName('tarjeta') //canvas donde se pondra la imagen original 
let contenedor = document.getElementsByClassName('contenedor') //canvas donde se pondra la imagen original 
let recortito = document.getElementById('Canvascut') //Canvas para el recorte de P1 

let recortitos = []
let recortitosCtx = []
for (let i = 0; i < 4; i++) {
    recortitos.push(document.getElementById('Canvascut' + (i + 1)))
    recortitosCtx.push(recortitos[i].getContext("2d"))
}
/************************************************ canva de la imagen colocada*/
let Captura = document.getElementById('Captura')
let Capturactx = Captura.getContext('2d')

//*************************Socket block */
const socket = io();
let seriales = []
let modeloTarjeta = null
socket.on('Sequence_start', function (infoScanner, port) {
    infoScanner != 0 ? startSequence(infoScanner, port) : console.log("Algo salio mal en el backend");
});

function startSequence(infoScanner, port) {
    // console.log(seriales)
    seriales.splice(port, 0, infoScanner)
    seriales.length != 2 ? console.log("Waiting for second serial") : Sequence()

}
/************************************************ llamada de las funciones de forma asincrona */
async function Sequence() {

    modeloTarjeta = seriales[1].slice(9,13)

    console.log(seriales)
    serialCorto = seriales[0].slice(20, 35)
    modeloTarjeta != '04-A' ? console.log("Modelo 16A") : segmentationModels[1]
    for (let point = 0; point < 4; point++) {
        console.log("***************CASO" + (point + 1) + "***************")
        await open_cam(point + 1)
        await captureimage()
        await snapshot(point + 1)
        for(let j = 0; j < segmentationModels[point].length;j++){
            await predict(point+1, j+1)
            await analisis(point+1,j + 1)
            await snapshotRecorte(point+1,j + 1)
            await eliminarcoords()
        }
        await stopcam()
    }
    console.log(boxpoint)
    await evaluaArray()
    query()
    // setTimeout(function fire() { location.reload() }, 2000);// temporizador para limpiar pantalla
}
async function gopen() {
    return new Promise(async resolve => {
        const socket = io();
        socket.emit('openClient')
        setTimeout(function fire() { resolve('resolved') }, 1000)
    })
}
async function query(){
    await gopen()
    const socket = io()
    // socket.emit('openClient')
    socket.emit('statusRegistrar', serialCorto, statusPuntos)
}
async function eliminarcoords(){
    return new Promise(async resolve => {
        coords.x = null
        coords.y = null
        coords.width = null
        coords.height = null
        resolve('resolved')
    })
}
//*************************FUNCIONES ANALISIS
async function analisis(p,j) {
    return new Promise(async resolve => { // inicio de promesa --
        recortitosCtx[p - 1].drawImage(fullimage, coords.x, coords.y, coords.width, coords.height, 0, 0, recortitosCtx[p - 1].canvas.width, recortitosCtx[p - 1].canvas.height) // coordenada y tamaño de recorte en el canvas
        await mlinspector(recortitos[p - 1], p,j)
        statusPuntos.push(statusf)
        boxpoint.push(statusf)// Array guarda el valor de cada punto analizado 
        resolve('resolved')
    })
}

async function evaluaArray() {
    return new Promise(async resolve => {
        console.log("evaluarray: boxpoint = ", boxpoint)
        let resultadofinal = boxpoint.some((e) => e == "0")
        // console.log(resultadofinal+"AAAAAAAAAAAA")
        if (resultadofinal == false) {
            console.log(resultadofinal)
            await plc_response(resultadofinal)
            pass()


        } else {
            await plc_response(resultadofinal)
            fail()


        }
        console.log("Resultado final ---> " + boxpoint)
        console.log("Resultado final " + resultadofinal)
        resolve('resolved')
    })
}
//****************************************** Backend call functions

async function plcelevado() {
    // const socket = io();
    socket.emit('plc_response', resulstatus);
}

function open_cam(point) {
    return new Promise(async resolve => {
        if (point == 1) { camid = "9ee5eb68040faf2690b22b5c2c43a108e21f7fee4530bba6c4e6005052dc9060" }
        if (point == 2) { camid = "6c3ef06917d926ec8bd3bb4b65cb44b22040692830689293eb2cf0801495b715" }
        if (point == 3) { camid = "7a218b7ee9ea107fb8490dd9be17b2272c8244679cd56d6a986c74621a174c01" }
        if (point == 4) { camid = "ab62b6c49cb4612b3272ceca16bbd4dec0fcf2a0d87433265691176ca97dd238" }
        const video = document.querySelector('video')
        const vgaConstraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                "frameRate": 30,
                "resizeMode": "crop-and-scale",
                deviceId: camid
            }//llave video
        }

        await navigator.mediaDevices.getUserMedia(vgaConstraints).then((stream) => { video.srcObject = stream }).catch(function (err) { console.log(err.name) })

        setTimeout(function fire() { resolve('resolved') }, 1000)
    })
}
/************************************************ Tomar la foto */
async function captureimage() {
    return new Promise(async resolve => {

        const video = document.getElementById("video")

        fullimagectx.drawImage(video, 0, 0, fullimage.width, fullimage.height) // Dibuja en el fullimage la captura de la imagen 1
        Capturactx.drawImage(fullimage, 0, 0, Captura.width, Captura.height)
        setTimeout(function fire() { resolve('resolved'); }, 500) //tiempo para el opencam
        resolve('resolved')
    })
}

function mapcams() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const filtered = devices.filter(device => device.kind === 'videoinput');
            console.log('Cameras found', filtered);

            filtered.forEach(camera => {
                console.log('Camera ID:', camera.deviceId);
                localStorage.setItem("ids", camera.deviceId)

            });
        });
}
/************************************************ Guardado de imagen */
async function snapshot(point) {

    console.log('guardar la imagen en su carpeta.')
    return new Promise(async resolve => {
        var dataURI = fullimage.toDataURL('image/jpeg')
        await savepic(dataURI, point) //savepic(dataURI,point);
        resolve('resolved')
    })
}
async function snapshotRecorte(point,j) {
    return new Promise(async (resolve) => {
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = coords.width
        tempCanvas.height = coords.height

        let tempCtx = tempCanvas.getContext('2d');
        // console.log("coords: ",coords.width,coords.height)
        tempCtx.drawImage(fullimage, coords.x, coords.y, coords.width, coords.height, 0, 0, coords.width, coords.height);
        const dataURI = tempCanvas.toDataURL('image/jpeg');
        
        tempCanvas.remove();
        
        // console.log("soy data uri",dataURI)
        dataURI == 'data:,' ? console.log("No se detectó nada") : await savingpicpruebas(dataURI, point,j)

        resolve("resolved")
    });
}
async function savingpicpruebas(uri, point,j) {
    const socket = io();
    socket.emit('picsavingpruebas', uri, point, serialCorto,j)
}

function stopcam() {
    return new Promise(async resolve => {
        const video = document.querySelector('video');

        const mediaStream = video.srcObject;

        const tracks = mediaStream.getTracks();
        tracks.forEach(track => { track.stop() })
        setTimeout(function fire() { resolve('resolved'); }, 1000);
    });//Cierra Promise principal
}
// async function predictAnalisis(point) {
//     return new Promise(async resolve => {
//         let input_size
//         let image
//         input_size = segmentationModels[point - 1].input_size
//         image = tf.browser.fromPixels(fullimage, 3)
//         image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])
//         let predictions = await segmentationModels[point - 1].executeAsync(image)
//         await highlightResults(predictions, point)
//     })
// }
//analiza la imagen full 
async function predict(point,j) {
    return new Promise(async resolve => {
        fullimage = document.getElementById('CanvasFHD')
        // predictAnalisis(point)
        let input_size
        let image
        console.log(segmentationModels[point-1][j-1])
        input_size = segmentationModels[point-1][j-1].input_size
        image = tf.browser.fromPixels(fullimage, 3)
        image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])


        let predictions = await segmentationModels[point-1][j-1].executeAsync(image)
        await highlightResults(predictions, point)
        resolve('resolved')
    });
}

//************************************************************************************** Funciones de recuadros ubica */
var children = []
let criterio = 0.00003

async function highlightResults(predictions, point) {
    let bboxLeft1, bboxTop1, bboxWidth1, bboxHeight1
    // console.log(predictions)

    for (let n = 0; n < predictions[0].length; n++) {

        // Check scores
        if (predictions[1][n] > criterio) {
            // console.log("predictions ")
            // console.log("criterio " + criterio)
            coords.x = (predictions[0][n][0] * fullimagectx.canvas.width)
            coords.y = (predictions[0][n][1] * fullimagectx.canvas.height)
            coords.width = (predictions[0][n][2] * fullimagectx.canvas.width) - coords.x
            coords.height = (predictions[0][n][3] * fullimagectx.canvas.height) - coords.y

            bboxLeft1 = (predictions[0][n][0] * Capturactx.canvas.width)
            bboxTop1 = (predictions[0][n][1] * Capturactx.canvas.height)
            bboxWidth1 = (predictions[0][n][2] * Capturactx.canvas.width) - bboxLeft1
            bboxHeight1 = (predictions[0][n][3] * Capturactx.canvas.height) - bboxTop1

            Capturactx.strokeStyle = 'blue';
            Capturactx.lineWidth = 4;
             Capturactx.strokeRect(bboxLeft1, bboxTop1, bboxWidth1, bboxHeight1);
            console.log("soy coordenadas: ", coords.x,coords.y,coords.width,coords.height)
        }
    }

}
//*************Clasificacion
async function mlinspector(cut, point,j) {
    return new Promise(async resolve => { // inicio de promesa 
        await call(cut, point,j)
        resolve('resolved')
    })
}
async function call(cut, point,j) {
    let result = 0, falla = 0, pasa
    result = await clasificationModels[point-1][j-1].executeAsync(cut)

    falla = result[0][1]
    console.log('Valor de falla clasificacion', falla)
    pasa = result[0][0]
    console.log('Valor de pasa clasificacion', pasa)
    if (pasa >= falla && coords.x != null) { //Evalua el valor en la posicion 0 que da la redneuronal
        statusf = 1
        console.log("pass -> " + "Punto: " + point, statusf)
    } else {
        statusf = 0
        console.log("fail -> " + "Punto: " + point, statusf)
    }

}
async function pass() {
    document.getElementById('tarjeta2').style.background = '#00ff40'
    resulstatus = "Pass"
    await passsweet()
}
async function fail() {
    document.getElementById('tarjeta2').style.background = '#cf010b'
    resulstatus = "Fail"
    await failsweet()
}

async function removeHighlights() {
    for (let i = 0; i < children.length; i++) {
        imageOverlay.removeChild(children[i])
    }
    children = []
}

/************************************************ Conexion socket */

async function savepic(uri, point) {
    return new Promise(async resolve => {
        socket.emit('picsaving', uri, point, serialCorto);
        resolve('resolved')
    })
}

async function renombra() {
    return new Promise(async resolve => {
        socket.emit('renombrasnr', serialCorto);
        resolve('resolved')
    });
}
async function logsaving(logarray, serial, logsave) {
    return new Promise(async resolve => {

        socket.emit('logsaving', logarray, serial, logsave);
        resolve('resolved')
    });
}
async function plc_response(resultado) { //El Array boxpoint guarda la equivalencia del punto, cuando vale pass o cuando vale fail
    return new Promise(async resolve => {
        console.log("plc_response: sn = ", serialCorto)
        let logarray =
            "\n" + "serial: " + serialCorto + "\n" +
            `Point 1-1 Insuficiencia Top J1-1 = ${boxpoint[0]} --> ` + `${boxpoint[0] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 1-2 Insuficiencia Top J1-2 = ${boxpoint[1]} --> ` + `${boxpoint[1] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 1-3 Exceso Top J1-1 = ${boxpoint[2]} --> ` + `${boxpoint[2] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 1-4 Exceso Top J1-2 = ${boxpoint[3]} --> ` + `${boxpoint[3] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 1-5 Daño Fisico J1 = ${boxpoint[4]} --> ` + `${boxpoint[4] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 1-6 Ranuras J1 = ${boxpoint[5]} --> ` + `${boxpoint[5] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 2-1 Daño Varistor Z6 = ${boxpoint[6]} --> ` + `${boxpoint[6] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 3-1 = ${boxpoint[7]} --> ` + `${boxpoint[7] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 3-2 Insuficiencia Bottom J1-1 = ${boxpoint[8]} --> ` + `${boxpoint[8] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 3-3 Insuficiencia Bottom J1-2 = ${boxpoint[9]} --> ` + `${boxpoint[9] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 3-4 Exceso Bottom J1-1 = ${boxpoint[10]} --> ` + `${boxpoint[10] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 3-5 Exceso Bottom J1-2 = ${boxpoint[11]} --> ` + `${boxpoint[11] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            `Point 4-1 Sin evidencia de pin = ${boxpoint[12]} --> ` + `${boxpoint[12] == 0 ? 'Fail' : 'Pass'}` + "\n" + "\n" + ""
            // "Point 1 Conector J4 " + " = " + boxpoint[0] + " --> " + `${boxpoint[0] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            // "Point 2 Conector J2 " + " = " + boxpoint[1] + " --> " + `${boxpoint[1] == 0 ? 'Fail' : 'Pass'}` + "\n" +
            // "Point 3 Conector J8" + " = " + boxpoint[2] + " --> " + `${boxpoint[2] == 0 ? 'Fail' : 'Pass'}` + "\n" + "\n" + ""

        console.log("soy boxpoint: " + boxpoint)
        await logsaving(logarray, serialCorto)
        console.log("estoy en logsaving")

        if (resultado) {
            await renombra()
        }

        console.log("soy logarray: " + logarray)
        resolve('resolved')
    })
}

