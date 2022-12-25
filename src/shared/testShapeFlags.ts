const ShapeFlags={
    element:0,
    stateful_component:0,
    text_children:0,
    array_children:0,
}

// vnode -> stateful_component 
// 1. 设置 修改
// ShapeFlags.stateful_component=1
// ShapeFlags.array_children=1

// 2. 查找
// if(ShapeFlags.element)
// if(ShapeFlags.stateful_component)

// 以上的方式 不够高效 -> 使用 位运算 方式
// 0000
// 0001 -> element
// 0010 -> stateful
// 0100 -> text_children
// 1000 -> array_children

// 1010 -> stateful array_children
// 0110 -> stateful text_children
// 1001 -> element array_children
// 0101 -> element text_children

// | (两位都为0，才为0)
// & (两位都为1，才为1)

// 修改 |
// 0001 -> element
// 0100 -> text_children
// ----
// 0101 -> element text_children

// 查找 &
// 0101 -> element text_children
// 0100 -> text_children
// ----
// 0100 -> text_children
