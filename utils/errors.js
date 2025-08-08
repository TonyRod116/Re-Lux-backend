export class InvalidDataError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'InvalidDataError'
    this.isCustomError = true
    this.status = 400
    this.field = field
    this.response = { [field]: message }
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
    this.status = 404
  }
}

export class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'ValidationError'
    this.status = 400
    this.field = field
  }
}

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnauthorizedError'
    this.status = 401
  }
}