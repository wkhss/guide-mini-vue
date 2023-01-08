
const p=Promise.resolve()
const queue:any[]=[]
let isFlush=false

export function nextTick(fn){
    return fn?p.then(fn):p
}

export function queueJob(job){
    if(!queue.includes(job)){
        queue.push(job)
    }

    queueFlush()
}

function queueFlush(){
    if(isFlush)return
    isFlush=true

    nextTick(flushJobs)
}

function flushJobs(){
    isFlush=false

    let job
    while((job=queue.shift())){
        job && job()
    }
}
