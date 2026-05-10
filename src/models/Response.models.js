class Response {
    constructor(status, message, response, pagination = null) {
      this.status = status;
      this.message = message;
      this.response = response;

      if (pagination) {
        this.pagination = pagination;
      }
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

    static paginated(status, message, response, pagination) {
      return new Response(status, message, response, pagination);
    }
  }
  
  module.exports = Response;
