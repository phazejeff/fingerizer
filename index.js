const load = async () => {
    await faceapi.loadTinyFaceDetectorModel('/models')
    await faceapi.loadFaceLandmarkTinyModel('/models')
}

const detect = async (input) => {
    let inputSize = Math.round(((input.width + input.height)/2) / 32) * 32
    inputSize = (inputSize > 800) ? 800 : inputSize
    console.log(input.width)
    console.log(input.height)
    console.log(inputSize)
    const options = new faceapi.TinyFaceDetectorOptions({inputSize: inputSize})
    const detections = await faceapi.detectAllFaces(input, options).withFaceLandmarks(true)
    return detections
}

const findAngle = (nose) => {
    const noseTop = nose[0]
    const noseMid = nose[3]

    const dx = noseTop._x - noseMid._x
    const dy = noseTop._y - noseMid._y
    return (Math.atan2(dy, dx) + Math.PI/2)
}

const placeMike = async (canvas, ctx, detections, mike) => {
    for (i=0; i < detections.length; i++) {
        const mikeClone = mike.cloneNode()
        mikeClone.width = detections[i].alignedRect._box._width
        mikeClone.height = detections[i].alignedRect._box._height
        const mikeCloneCanvas = document.createElement("canvas")
        mikeCloneCanvas.hidden = true
        mikeCloneCanvas.width = mikeClone.width
        mikeCloneCanvas.height = mikeClone.height
        mikeCloneCanvas.getContext("2d").drawImage(mikeClone, 0, 0, mikeClone.width, mikeClone.height)


        finger = await detect(mikeCloneCanvas)
        if (finger[0] === undefined) { 
            console.log('^ that didnt work')
            ctx.drawImage(
                mikeClone,
                detections[i].alignedRect._box._x,
                detections[i].alignedRect._box._y,
                mikeClone.width,
                mikeClone.height
            )
        } else {
            const nose = detections[i].landmarks.getNose()
            const fingerNoseCenter = finger[0].landmarks.getNose()[3]
            const noseCenter = nose[3]

            const rotateBy = findAngle(nose)

            ctx.save()
            ctx.translate(
                (detections[i].alignedRect._box._x - ((detections[i].alignedRect._box._x + fingerNoseCenter._x) - noseCenter._x)) + (mikeClone.width/2), 
                (detections[i].alignedRect._box._y - ((detections[i].alignedRect._box._y + fingerNoseCenter._y) - noseCenter._y)) + (mikeClone.height/2)
            )
            ctx.rotate(rotateBy)
            ctx.drawImage(
                mikeClone, 
                0 - (mikeClone.width/2),
                0 - (mikeClone.height/2),
                mikeClone.width,
                mikeClone.height
            )
            ctx.restore()
        }
        
    }

    // faceapi.draw.drawFaceLandmarks(canvas, detections, {drawLines: true})
    // faceapi.draw.drawFaceLandmarks(canvas, finger, {drawLines: true})
    return canvas
}

const input = document.getElementById("myImg")
const mike = document.getElementById("mike")

load().then(() => {
   detect(input) 

   .then((detections) => {

        const canvas = document.createElement("canvas")
        canvas.width = input.width
        canvas.height = input.height
        let ctx = canvas.getContext('2d')
        ctx.drawImage(input, 0, 0)
        placeMike(canvas, ctx, detections, mike)
        .then((canvas) => {
            let image = new Image()
            input.src = canvas.toDataURL()
        })
    })
})


