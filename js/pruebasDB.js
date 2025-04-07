async function gopen() {
    return new Promise(async resolve => {
        const socket = io();
        socket.emit('openClient')
        // console.log("conectado!!")
        setTimeout(function fire() { resolve('resolved') }, 1000)
    })
}
let serial = "SASDASFADSFASDASDASDAS"
let statusPuntos = []

// statusPuntos.push(sn)

for(let i = 0;i<13;i++){
    statusPuntos.push(0)
}
query()
async function query(){
    await gopen()
    const socket = io()
    // socket.emit('openClient')
    console.log("AAA")
    socket.emit('statusRegistrar', serial, statusPuntos)
}
//P1545622-01-C:REV02-SANN250250001Z1
//P155190000A-SBRN24243101071