/**
 * koishi——data文件夹创建器，至多一个子文件夹
 * @param mainfile 主文件夹名称,
 * @param filename 子文件夹名称
 * @returns 文件夹路径
 */
export declare function rootF(mainfile?: any, filename?: any): Promise<string>;
/**
 * 文件搜索器,判断文件是否存在
 * @param filePath 文件路径
 */
export declare function file_search(filePath: string): Promise<boolean>;
