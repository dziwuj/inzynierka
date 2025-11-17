import { FC } from "react";
import { AppRouter } from "@routes/AppRouter";
import { observer } from "mobx-react";
import { Bounce, ToastContainer } from "react-toastify";

import { PWAToasts } from "@/components";

const App: FC = observer(() => {
  return (
    <>
      <AppRouter />
      <PWAToasts />
      <ToastContainer
        position="bottom-left"
        autoClose={false}
        newestOnTop
        theme="dark"
        transition={Bounce}
      />
    </>
  );
});

export default App;
