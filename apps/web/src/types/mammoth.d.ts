declare module 'mammoth' {
  interface ConversionResult {
    value: string
    messages: unknown[]
  }
  function convertToMarkdown(input: { arrayBuffer: ArrayBuffer }): Promise<ConversionResult>
  function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ConversionResult>
}
