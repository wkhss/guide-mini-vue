import typescript from "@rollup/plugin-typescript"
import pkg from './package.json'

export default{
    input:'./src/index.ts',// 入口
    output:[// 出口
        // 库打包类型
            // cjs -> commonjs
            // esm 
        {
            format:'cjs',
            file:pkg.main,
        },
        {
            format:'es',
            file:pkg.module,
        }
    ],
    plugins:[
        typescript()
    ]
}
