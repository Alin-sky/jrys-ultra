"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.usage = exports.Config = exports.name = exports.using = exports.inject = void 0;
const koishi_1 = require("koishi");
const jrys_1 = require("./jrys");
const crypto_1 = __importDefault(require("crypto"));
exports.inject = { required: ['canvas'] };
exports.using = ['canvas'];
exports.name = 'jrys-ultra';
exports.Config = koishi_1.Schema.object({
    font: koishi_1.Schema.string().default('YouYuan').description('字体设置(使用系统自带字体，填写系统自带字体的[英文名](https://www.cnblogs.com/chendc/p/9298832.html)，只研究了win系统)'),
    url: koishi_1.Schema.string().required().description('图片或随机图链接'),
    blurs: koishi_1.Schema.number().role('slider').min(0).max(100).step(1).default(60).description('透明度'),
    color: koishi_1.Schema.string().required().role('color').description('模糊框背景色'),
});
exports.usage = `
# koishi-plugin-jrys-ultra
# 运势文案和算法借(chao)鉴(xi)了[jryspro](https://github.com/Twiyin0/koishi-plugin-jryspro/tree/main),感谢大佬
`;
function apply(ctx, config) {
    const fonts = config.font;
    const blur = config.blurs;
    const url = config.url;
    const color = config.color;
    const log1 = "jrys-ultra";
    const logger = new koishi_1.Logger(log1);
    const random = new koishi_1.Random(() => Math.random());
    function getyunshi_text(num) {
        return {
            jrys: jrys_1.jrysJson[num],
            num: num
        };
    }
    async function getImageSizeAndLog(imageUrl, num, color, blurs) {
        try {
            // 使用 ctx.canvas.loadImage 加载网络图像
            const image = await ctx.canvas.loadImage(imageUrl);
            var width = image.width;
            var height = image.height;
            //进行横竖判断
            var type = false;
            if (height >= width) {
                type = true;
            }
            else {
                type = false;
            }
            //进行尺寸限制
            if (width > 2560 || height > 1440) {
                const x = width / 2560;
                const y = height / 1440;
                if (x > y) {
                    height = height / x;
                    width = width / x;
                }
                else {
                    width = width / y;
                    height = height / y;
                }
            }
            const canvass = await ctx.canvas.createCanvas(width, height);
            const ctximg = canvass.getContext('2d');
            ctximg.drawImage(image, 0, 0, width, height);
            // 在画布的左上角画一个圆角矩形
            var size_type = {
                rw: 1,
                rh: 1,
                rx: 1,
                ry: 1
            };
            if (type) {
                //竖屏
                size_type.rw = (width / 15) * 14;
                size_type.rh = height / 3.8;
                size_type.rx = (width / 30); // 矩形的 x 坐标
                size_type.ry = (height / 8) * 5.8; // 矩形的 y 坐标
            }
            else {
                size_type.rw = width / 4;
                size_type.rh = (height / 10) * 9.5;
                size_type.rx = (width / 50); // 矩形的 x 坐标
                size_type.ry = height / 40; // 矩形的 y 坐标
            }
            const rectWidth = size_type.rw;
            const rectHeight = size_type.rh;
            const cornerRadius = 50; // 圆角半径
            const rectX = size_type.rx;
            const rectY = size_type.ry;
            ctximg.save(); // 保存当前的上下文状态
            // 创建圆角矩形路径
            ctximg.beginPath();
            ctximg.moveTo(rectX + cornerRadius, rectY);
            ctximg.lineTo(rectX + rectWidth - cornerRadius, rectY);
            ctximg.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);
            ctximg.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
            ctximg.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);
            ctximg.lineTo(rectX + cornerRadius, rectY + rectHeight);
            ctximg.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);
            ctximg.lineTo(rectX, rectY + cornerRadius);
            ctximg.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);
            ctximg.closePath();
            ctximg.clip(); // 应用剪辑路径
            ctximg.filter = `blur(${blurs}px)`;
            ctximg.fillStyle = color;
            ctximg.drawImage(image, 0, 0, width, height);
            ctximg.fill();
            ctximg.shadowColor = 'transparent'; // 移除阴影
            ctximg.filter = 'none'; // 移除模糊效果
            ctximg.restore(); // 恢复上下文状态，移除剪辑路径
            let text = getyunshi_text(num);
            let lev = text.jrys.fortuneSummary;
            let star = text.jrys.luckyStar;
            let text1 = text.jrys.signText;
            let text2 = text.jrys.unsignText;
            function text_lev(lev, star, type) {
                if (type) {
                    let x = width / 2;
                    let y = (height / 6) * 4.55;
                    ctximg.textAlign = 'center'; // 水平居中
                    const fontSize = width / 25;
                    ctximg.font = `bold ${fontSize}px ${fonts}`;
                    ctximg.fillStyle = '#000000';
                    ctximg.fillText(lev, x, y);
                    y += width / 25;
                    ctximg.fillText(star, x, y);
                }
                else {
                    let x = width / 7;
                    let y = (height / 6) * 0.73;
                    ctximg.textAlign = 'center'; // 水平居中
                    const fontSize = width / 45;
                    ctximg.font = `bold ${fontSize}px ${fonts}`;
                    ctximg.fillStyle = '#000000';
                    ctximg.fillText(lev, x, y);
                    y += width / 35;
                    ctximg.fillText(star, x, y);
                }
            }
            function text_lay(text1, text2, type) {
                if (type) {
                    let x = (width / 15) * 2;
                    let y = (height / 6) * 5.3;
                    let lineHeight = width / 33; // 行高
                    const fontSize = width / 35;
                    //横
                    ctximg.beginPath();
                    ctximg.moveTo((width / 15) * 1.25, (height / 6) * 4.85);
                    ctximg.lineTo((width / 15) * 13.75, (height / 6) * 4.85);
                    ctximg.stroke();
                    ctximg.font = `bold ${fontSize * 1.05}px ${fonts}`;
                    ctximg.fillStyle = '#000000';
                    ctximg.textAlign = 'center';
                    ctximg.fillText(text1, width / 2, y * 0.96);
                    ctximg.font = `bold ${fontSize}px ${fonts}`;
                    ctximg.textAlign = 'left';
                    for (let char of text2) {
                        ctximg.fillText(char, x, y);
                        x += lineHeight;
                        if (x > (width / 15) * 13.5) {
                            y += lineHeight;
                            x = (width / 15) * 1.5;
                        }
                    }
                    ctximg.font = `bold ${fontSize * 0.5}px ${fonts}`;
                    ctximg.fillStyle = '#000000';
                    ctximg.textAlign = 'center';
                    ctximg.fillText('仅供娱乐|相信科学|请勿迷信', width / 2, height * 0.97);
                }
                else {
                    let x1 = width / 4.3;
                    let x2 = width / 6.35;
                    let y = height / 4;
                    let lineHeight = width / 50; // 行高
                    const fontSize = width / 55;
                    ctximg.font = `bold ${fontSize}px ${fonts}`;
                    ctximg.fillStyle = '#000000';
                    //竖线
                    ctximg.beginPath();
                    ctximg.moveTo(width / 5, height / 4.2);
                    ctximg.lineTo(width / 5, height * 0.85);
                    ctximg.stroke();
                    for (let char of text2) {
                        ctximg.fillText(char, x2, y);
                        y += lineHeight; // 更新 y 坐标，使得下一个字符在下一行绘制
                        if (y > (height * 0.95)) {
                            x2 -= lineHeight * 1.15;
                            y = height / 4;
                        }
                    }
                    //重置y
                    y = height / 4;
                    for (let char of text1) {
                        ctximg.fillText(char, x1, y);
                        y += lineHeight; // 更新 y 坐标，使得下一个字符在下一行绘制
                        if (y > (height * 0.95)) {
                            x1 -= lineHeight * 1.15;
                            y = height / 4;
                        }
                    }
                    ctximg.font = `bold ${fontSize * 0.5}px ${fonts}`;
                    ctximg.fillStyle = '#000000';
                    ctximg.textAlign = 'center';
                    ctximg.fillText('仅供娱乐|相信科学|请勿迷信', width / 7, height * 0.97);
                }
            }
            text_lay(text1, text2, type);
            text_lev(lev, star, type);
            const buffers = canvass.toBuffer('image/png');
            return buffers;
        }
        catch (error) {
            logger.info('渲染图像时出错：', error);
        }
    }
    ctx.command('jrysultra [red] [green] [blue] [alpha] [blurs]', '输出今日运势图片')
        .alias('今日运势')
        .usage('可传入文字框的颜色和透明度(透明度最高100)')
        .example('jrysultra 102 204 255 0.6 40  【rgba的四个值和模糊度】')
        .option('text', '-t 文字输出')
        .action(async ({ options, session }, red, green, blue, alpha, blurs) => {
        if (options.text) {
            let text = getyunshi_text(getJrys(session));
            try {
                session.send(koishi_1.h.image(url));
            }
            catch (error) {
                logger.info(error);
            }
            return (`
你的今日运势为：
⚫${text.jrys.fortuneSummary}
⚪${text.jrys.luckyStar}
⚫${text.jrys.signText}
⚪${text.jrys.unsignText}
        `);
        }
        var colors = color;
        var blurss = blur;
        function Data_review(red, green, blue, alpha, blurs) {
            red = parseInt(red);
            green = parseInt(green);
            blue = parseInt(blue);
            alpha = parseFloat(alpha);
            blurs = parseInt(blurs);
            if (typeof red == 'number' && red >= 0 && red <= 255 &&
                typeof green == 'number' && green >= 0 && green <= 255 &&
                typeof blue == 'number' && blue >= 0 && blue <= 255) {
                if (typeof alpha === 'number' && alpha >= 0 && alpha <= 1) {
                    colors = `rgba(${red},${green},${blue},${alpha})`;
                    if (typeof blurs === 'number' && blurs >= 0 && blurs <= 100) {
                        blurss = blurs;
                    }
                    else {
                        blurss = blur;
                    }
                    return [colors, blurss];
                }
                else {
                    colors = `rgba(${red},${green},${blue},0.5)`;
                    if (typeof blurs === 'number' && blurs >= 0 && blurs <= 100) {
                        blurss = blurs;
                    }
                    else {
                        blurss = blur;
                    }
                    return [colors, blurss];
                }
            }
            else {
                colors = color;
                blurss = blur;
                return [colors, blurss];
            }
        }
        function getJrys(session) {
            const md5 = crypto_1.default.createHash('md5');
            const hash = crypto_1.default.createHash('sha256');
            // 获取当前日期的零点时间戳（毫秒）
            const etime = new Date().setHours(0, 0, 0, 0);
            let userId;
            // 如果 session.userId 是数字，则直接使用
            if (!isNaN(Number(session.userId))) {
                userId = session.userId;
            }
            else {
                // 否则，如果 session.userId 存在，则使用 SHA256 哈希算法计算哈希值，然后取模得到一个数字
                if (session.userId) {
                    hash.update(session.userId);
                    let hashhexDigest = hash.digest('hex');
                    userId = Number(parseInt(hashhexDigest, 16)) % 1000000001;
                }
                // 如果 session.userId 不存在，则使用 MD5 哈希算法计算 session.username 的哈希值，然后取模得到一个数字
                else {
                    md5.update(session.username);
                    let hexDigest = md5.digest('hex');
                    userId = parseInt(hexDigest, 16) % 1000000001;
                }
            }
            // 这个索引是根据当前日期的零点时间戳（秒）和用户 ID 的和乘以一个常数，然后对运势数组的长度加一取模得到的
            var todayJrys = ((etime / 1000 + userId) * 2333) % (jrys_1.jrysJson.length + 1);
            todayJrys = todayJrys % 80;
            // 返回对应索引的运势
            return Number(todayJrys);
        }
        console.log(getJrys(session));
        const art = Data_review(red, green, blue, alpha, blurs);
        for (let i = 1; i < 4; i++) {
            try {
                const imgBuffer = await getImageSizeAndLog(url, getJrys(session), art[0].toString(), Number(art[1]));
                return koishi_1.h.image(imgBuffer, 'image/jpg');
            }
            catch {
                logger.info('渲染出错，进行第' + i + '次重试');
                if (i == 3) {
                    logger.info('尝试' + i + '次后依旧出错');
                    return '呜呜呜，图片渲染出错了＞﹏＜';
                }
            }
        }
    });
}
exports.apply = apply;
