import Link from "next/link";
import React, { FC, PropsWithChildren } from "react";

import { ErrorBoundary } from "../../web/common/ErrorBoundary";
import { Logo2 } from "../../web/icons";
import { NavMenu } from "./NavMenu";

const Layout: FC<PropsWithChildren> = ({ children }) => {
  // The correct way to do this would be by passing a prop to Layout,
  // and to get the last updating using server side props.

  return (
    <div>
      <div>
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex gap-8">
                <Link
                  href="/"
                  className="font-md flex items-center gap-2 no-underline"
                >
                  <Logo2 className="h-8 w-8" />
                  <span className="text-sm text-gray-700 sm:text-2xl">
                    Metaforecast
                  </span>
                </Link>
                <Link
                  href="/status"
                  className="mt-1.5 hidden self-baseline text-sm text-slate-400 no-underline hover:text-slate-900 sm:mt-2.5 sm:block"
                >
                  Status
                </Link>
              </div>

              <NavMenu />
            </div>
          </div>
        </nav>
        <main>
          <ErrorBoundary>
            <div className="container mx-auto mb-10 max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default Layout;
