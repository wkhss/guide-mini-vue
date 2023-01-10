import { NodeTypes } from "./ast"

const enum TagType{
    Start,
    End
}

export function baseParse(content:string){
    const context=createParseContext(content)
    return createRoot(parseChildren(context))
}

function createRoot(children){
    return {
        children
    }
}

function parseChildren(context:any){
    const nodes:any=[]

    let node
    if(context.source.startsWith('{{')){
        node=parseInterpolation(context)
    }else if(context.source[0]==='<'){
        if(/[a-z]/i.test(context.source[1])){
            node=parseElement(context)
        }
    }

    nodes.push(node)

    return nodes
}

function parseElement(context:any){

    // 1.解析 tag
    const element=parseTag(context,TagType.Start)
    parseTag(context,TagType.End)
    return element
}

function parseTag(context:any,type:TagType){
    const match:any=/^<\/?([a-z]*)/.exec(context.source)
    const tag=match[1]
    
    // 2.删除解析后的代码
    advanceBy(context,match[0].length)
    advanceBy(context,1)

    if(type===TagType.End)return
    
    return {
        type:NodeTypes.ELEMENT,
        tag,
    }
}

function parseInterpolation(context:any){

    const openDelimiter='{{'
    const closeDelimiter='}}'

    const closeIndex=context.source.indexOf(closeDelimiter,openDelimiter.length)

    advanceBy(context,openDelimiter.length)

    const rawContentLength=closeIndex-openDelimiter.length

    const content=context.source.slice(0,rawContentLength)
    
    advanceBy(context,rawContentLength+closeDelimiter.length)

    return {
        type:NodeTypes.INTERPOLATION,
        content:{
            type:NodeTypes.SIMPLE_EXPRESSION,
            content,
        }
    }
}

function advanceBy(context:any,length:number){
    context.source=context.source.slice(length)
}

function createParseContext(content:string):any{
    return {
        source:content
    }
}
