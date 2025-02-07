import { FC } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeTw3Proxy<T extends FC>(Component: any) {
  return function Tw3Proxy(props: Parameters<T>[0]) {
    return (
      <div className="tw3">
        <Component {...props} />
      </div>
    );
  };
}
