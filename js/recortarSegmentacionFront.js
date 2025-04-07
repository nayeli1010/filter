
let segmentationModel = new cvstfjs.ObjectDetectionModel()
let clasificacionModel = new cvstfjs.ClassificationModel()
let rutaSegmentationModel = './model/segmentacion/model.json'
let rutaClasificacionModel = './model/clasificacion/model.json'
let fullImages = 0
let fullImage = new Image()
let canvasFullImage
let fullImagectx
let tempCanvas
let tempCtx
let totalAlto = 0, totalAncho = 0
let cont
let criterio = 0.2
let altoFI = 860
let anchoFI = 300
// let promedioAlto = 0, promedioAncho = 0
let coords = {
    x: null,
    y: null,
    height: null,
    width: null
}
loadmodel()
async function loadmodel() {
    segmentationModel.loadModelAsync(rutaSegmentationModel)
    clasificacionModel.loadModelAsync(rutaClasificacionModel)
    
    setTimeout(() => {
    loadImage(1,0,67)
    }, "1500");
}
async function predicts(rutaImageRecorte,j,i){
    return new Promise(async resolve =>{
        let pass = 0
        let etiqueta = false
        let input_size = segmentationModel.input_size
        let image = tf.browser.fromPixels(canvasFullImage, 3)
        image = tf.image.resizeBilinear(image.expandDims(), [input_size, input_size])
        let predictions = await segmentationModel.executeAsync(image)
        console.log(predictions)
        for(let n = 0;n < predictions[0].length;n++){
            if(predictions[2][n] == 0){
                if(predictions[1][n] > criterio){
                    pass++
                    coords.x = predictions[0][n][0] * anchoFI + j
                    coords.y = predictions[0][n][1] * altoFI + j    
                    await recorte(rutaImageRecorte+n+'.jpeg')
                    await esperar(100)
                }
                else{
                    
                    console.log("Prediccion no encontrada")
                }
            }
            if(predictions[2][n] == 1){
                if(predictions[1][n] > criterio){
                    etiqueta = true
                }
            }
        }
        pass == 2 && etiqueta != false ? console.log("PASA") : console.log("FALLA",pass)
        // if(predictions[1][0] > criterio){
        //     coords.x = predictions[0][0][0] * anchoFI + j
        //     coords.y = predictions[0][0][1] * altoFI + j
        //     await recorte(rutaImageRecorte+'.jpeg')
        //     await esperar(100)
        // }
        // else{
        //     console.log("Prediccion no encontrada")
        // }

        resolve('resolved')
    })
}
async function recorte(rutaImageRecorte) {
    return new Promise(resolve =>setTimeout(()=> {
        tempCanvas = document.getElementById('recorte')
        tempCtx = tempCanvas.getContext('2d')
        coords.height = tempCanvas.height
        coords.width = tempCanvas.width
        tempCanvas.height + coords.y > altoFI ? coords.y = altoFI - tempCanvas.height :
        coords.x + tempCanvas.width > anchoFI ? coords.x = anchoFI - tempCanvas.width :
        // console.log(coords)
        tempCtx.drawImage(canvasFullImage,coords.x,coords.y,coords.width,coords.height, 0, 0, tempCanvas.width, tempCanvas.height)
        totalAlto += coords.height
        totalAncho += coords.width
        let dataUri = tempCanvas.toDataURL('image/jpeg');
        dataUri == 'data:,' ? console.log("No se detectó nada") : imagenRecorte(dataUri,rutaImageRecorte)
        let inputSize = clasificacionModel.input_size
        // let imageCroped = tf.browser.fromPixels(tempCanvas,3)
        // imageCroped = tf.image.resizeBilinear(imageCroped.expandDims(), [inputSize, inputSize])
        // clasificacionPredicts(imageCroped,"Cropped image")
        // clasificacionPredicts(tempCanvas, "Original image")
        tempCtx.clearRect(0,0,50,50)
        resolve("resolved")
    },100))
}
async function clasificacionPredicts(image,text) {
    await esperar(50)
    // console.log(clasificacionModel)
    let result = await clasificacionModel.executeAsync(image)
    console.log(text,result)
}

async function loadImage(limit,name,nFullI){
    cont = 0
    for(let j=0;j<limit;j++){
        for(let i = 1; i <= nFullI;i++){
            await llenarCanvas(i,j,name)
            await esperar(100)
            await predicts(`P5MALAS/05 ${j+name} (${i})`,j,i)
            console.log(++cont)
            // await esperar(100)
            fullImagectx.clearRect(0,0,anchoFI,altoFI)
        }
    }
    console.log("PROMEDIO ALTO",totalAlto/cont)
    console.log("PROMEDIO ANCHO",totalAncho/cont)
    console.log("Termine")
}
function esperar(ms){
    return new Promise(resolve=> setTimeout(resolve,ms))
}
async function llenarCanvas(i,j,name){
    return new Promise(resolve=>setTimeout(() => {
        fullImage.src = `P5FIMALAS/05 (${i}).jpeg`
        canvasFullImage = document.getElementById('recortar')
        fullImagectx = canvasFullImage.getContext("2d")
        fullImage.addEventListener("load",()=>{
            fullImagectx.drawImage(fullImage,0,0)
        })
        resolve()
    },100))
}

async function imagenRecorte(datauri,rutaRecorte) {
    const socket = io();
    socket.emit('recorte', datauri, rutaRecorte)
}