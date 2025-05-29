declare namespace API {
  interface Response<T = any> {
    data: T;
    status: number;
  }
} 