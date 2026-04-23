/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 解析后的实际主题（system 会被解析为 light 或 dark）
 */
export type ResolvedTheme = 'light' | 'dark'
