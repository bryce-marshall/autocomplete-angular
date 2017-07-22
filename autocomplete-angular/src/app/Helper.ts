// import { stringFormat } from '@brycemarshall/string-format';

// export class Helper {
//     public static getRectString(r: ClientRect): string {
//         return "{top: " + r.top + ", right: " + r.right + ", bottom: " + r.bottom + ", left: " + r.left + ", width: " + r.width + ", height: " + r.height + "}";
//     }

//     public static logRectString(r: ClientRect) {
//         console.log(Helper.getRectString(r));
//     }

//     public static logWindowRect() {
//         Helper.logRectString(Helper.createRect(0, window.innerHeight, 0, window.innerWidth));
//     }

//     public static logDocumentRect() {
//         let el = document.documentElement;
//         Helper.logRectString(Helper.createRect(0, el.clientHeight, 0, el.clientWidth));
//     }    

//     public static logWindowScrollData() {
//         console.log(stringFormat("window: scrollX={0}, scrollY={1}, pageXOffset={2}, pageYOffset={3}", 
//         window.scrollX, window.scrollY, window.pageXOffset, window.pageYOffset));
//     }    

//     public static createRect(t: number, b: number, l: number, r: number): ClientRect {
//         return {
//             get top(): number {
//                 return t;
//             },
//             get bottom(): number {
//                 return b;
//             },
//             get left(): number {
//                 return l;
//             },
//             get right(): number {
//                 return r;
//             },
//             get width(): number {
//                 return r - l;
//             },
//             get height(): number {
//                 return b - t;
//             }
//         };
//     };
// }