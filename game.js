const playBtn= document.querySelector("button.play")
const stopBtn= document.querySelector('button.stop')
const clsBtn= document.querySelector('button.cls')
const savePtnBtn= document.querySelector('button.save')
const loadPtnBtn= document.querySelector('button.load')

const canvas= document.querySelector('canvas')
const {width, height} = canvas.getBoundingClientRect()
canvas.width= width
canvas.height= height
const ctx= canvas.getContext('2d')

// This is the game's behaviours sertings:
const GOL = {
    cases: {
        size: width/20, // size of a cell
        useExtraStates: false, // if you want to show witch cells had born/die
        colors: { // colors of the cells
            dead: "#333",
            live: "#eee",
            hasBorn: "#58C73E",
            hasDied: "#dd3d3d"
        },
        stroke: { // stroke (out of the cells)
            color: "#d66",
            width: 1.5
        }
    },
    state: null, // "playing" || "editing" || "pause"
    plate: {
        width: undefined,
        height: undefined,
        matrix: null,
        bgColor: getComputedStyle(document.body).backgroundColor,
        padding: [0,0]
    },
    updates: {
        main: 0, // main update
        game: 75 // cells' updates
    }
}

const temp = {
    lastGameUpdate: 0,
    matrix: []
}

function savePatern() {
    const {matrix}= GOL.plate
    const {size}= GOL.cases
    localStorage.setItem("gol", JSON.stringify({
        matrix, size
    }))
}
function loadPatern() {
    const item= localStorage.getItem('gol')
    if(!item) return
    try {
        var {matrix,size} = JSON.parse(item)
    } catch (e) {return}
    GOL.cases.size= size
    resetPlate()
    GOL.plate.matrix= matrix
}

function resetPlate() {
    GOL.plate.width= Math.floor(width/GOL.cases.size)
    GOL.plate.height= Math.floor(height/GOL.cases.size)
    GOL.plate.padding[0]= (width-GOL.plate.width*GOL.cases.size)/2
    GOL.plate.padding[1]= (height-GOL.plate.height*GOL.cases.size)/2
    GOL.plate.matrix= []
    for(let i = 0; i!=GOL.plate.height; i++) {
        GOL.plate.matrix.push([])
        for(let j=0;j!=GOL.plate.width;j++) GOL.plate.matrix[i].push(0)
    }
    temp.matrix=[...GOL.plate.matrix]
}

function drawPlate() {
    if(!GOL.plate.matrix || !GOL.plate.width || !GOL.plate.height) resetPlate()
    const {cases,plate} = GOL
    ctx.strokeStyle= cases.stroke.color
    ctx.lineWidth= cases.stroke.width
    ctx.fillStyle= plate.bgColor
    ctx.beginPath()
    ctx.fillRect(0,0,width,height)
    ctx.closePath()
    
    for(let y = 0; y<plate.height; y++) {
        for(let x = 0; x<plate.width; x++) {
            const state= temp.matrix[y][x]
            const {colors}= cases
            ctx.fillStyle= [colors.dead, colors.live, colors.hasDied, colors.hasBorn][state]
            ctx.beginPath()
            ctx.fillRect(x*cases.size+plate.padding[0], y*cases.size+plate.padding[1], cases.size, cases.size)
            ctx.strokeRect(x*cases.size+plate.padding[0], y*cases.size+plate.padding[1], cases.size, cases.size)
            ctx.closePath()
        }
    }
}

function play() {
    const now= new Date().getTime()
    if (now-temp.lastGameUpdate < GOL.updates.game-GOL.updates.main) return
    playBtn.classList.add('active')
    const {matrix}= temp
    const newMatrix=[]
    const directions= [
        [-1,1],[1,0],[0,1], [1,1]
    ]
    for(let y=0; y!=matrix.length;y++) {
        newMatrix.push([])
        for(let x=0;x!=matrix[y].length;x++) {
            const caseArround=[]
            for(const coef of [1,-1]) {
                for(const [dx,dy] of directions) {
                    const newCoord= [x+dx*coef, y+dy*coef]
                    if(!(0<=newCoord[0] && newCoord[0]<=matrix[y].length-1 && 0<=newCoord[1] && newCoord[1]<=matrix.length-1)) continue
                    caseArround.push(matrix[newCoord[1]][newCoord[0]])
                }
            }
            const isAlive= matrix[y][x]==1 || matrix[y][x]==3
            const arroundAlive= caseArround.filter(e=>e==1 || e==3)
            const arroundDeath= caseArround.filter(e=>e==0 || e==2)
            if(arroundAlive.length<2 || arroundAlive.length>3) {
                if(isAlive && GOL.cases.useExtraStates) newMatrix[y].push(2)
                else newMatrix[y].push(0)
            }else if (arroundAlive.length==3){
                if(!isAlive && GOL.cases.useExtraStates) newMatrix[y].push(3)
                else newMatrix[y].push(1)
            }
            else {
                if(isAlive) newMatrix[y].push(1)
                else newMatrix[y].push(0)
            }
        }
    }
    temp.matrix=[...newMatrix]
    temp.lastGameUpdate= now
}
function caseClicked(e) {
    if (GOL.state != "editing") return
    const { x, y } = e
    const case_w = Math.ceil((x * GOL.plate.width + GOL.plate.padding[0]) / width) - 1
    const case_h = Math.ceil((y * GOL.plate.height + GOL.plate.padding[1]) / height) - 1
    const from = GOL.plate.matrix[case_h][case_w]
    if (from == undefined) return
    GOL.plate.matrix[case_h][case_w] = from ? 0 : 1
}

function edit() {
    playBtn.classList.remove('active')
    playBtn.innerHTML= "Play"
    temp.matrix= [...GOL.plate.matrix]
}

function main() {
    drawPlate()
    const {state} = GOL
    switch (state) {
        case "playing": play();break
        case "editing": edit();break
        case "pause": break
        default: GOL.state="editing"
    }
}

function setEvents() {
    playBtn.onclick= ()=> {
        const {state}= GOL
        if(state=="playing") (GOL.state="pause") && (playBtn.innerHTML= "Play")
        else (GOL.state= "playing") && (playBtn.innerHTML="Pause")
    }
    stopBtn.onclick=() => (GOL.state= "editing")
    clsBtn.onclick=()=> resetPlate() & (GOL.state="editing")
    savePtnBtn.onclick=()=> savePatern() & (GOL.state="editing")
    loadPtnBtn.onclick=()=> loadPatern() & (GOL.state="editing")
    
    canvas.onclick= caseClicked
}
setEvents()
setInterval(main, GOL.updates.main)
