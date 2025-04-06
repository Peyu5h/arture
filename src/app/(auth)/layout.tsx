import { Metadata } from "next";
import { redirect } from "next/navigation";
import OnBoardText from "~/components/auth/OnBoardText";

export const metadata: Metadata = {
  title: "Auth",
};

export default async function Authlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="">
      <div className="">{children}</div>
    </div>
  );
}
