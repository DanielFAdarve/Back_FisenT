class Response {
    constructor(status, message, response) {
      this.status = status;
      this.message = message;
      this.response = response;
    }
  
    static set(...args) {
      if (args.length === 0) {
        return new Response(404, false, null);
      } else if (args.length === 1) {
        return new Response(200, true, args[0]);
      } else if (args.length === 2) {
        return new Response(args[0], args[1], null);
      } else if (args.length === 3) {
        return new Response(args[0], args[1], args[2]);
      }
    }
  }
  
  module.exports = Response;