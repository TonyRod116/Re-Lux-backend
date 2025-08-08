const notFound = (req, res, next) => { try {
  throw new Error('Not found')
} catch (error) {
  next(error)
}}

export default notFound