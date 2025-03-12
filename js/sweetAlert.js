
async function failsweet(canvas,indices){
  console.log("Aqui estoy en fail")
  return new Promise(async resolve => {
  Swal.fire({

    title: "FAIL",
    icon: "error",
   
    confirmButtonColor: "#CF010B",
   
  })

})

}

async function passsweet(){
  return new Promise(async resolve => {
  Swal.fire({

    title: 'PASS',
    icon: 'success',
    
    confirmButtonColor: "#2a2",
    
  })
  resolve('resolved')
})
}
