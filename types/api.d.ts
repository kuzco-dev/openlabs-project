declare namespace API {
  interface Response<T = any> {
    data: T;
    init?: {
      status: number;
    };
  }
} 