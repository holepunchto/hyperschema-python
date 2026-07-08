module.exports = {
  UNSUPPORTED_TYPE(name, kind) {
    const err = new Error(`hyperschema-python does not support ${kind}: ${name}`)
    err.code = 'UNSUPPORTED_TYPE'
    return err
  }
}
