import type { GetServerSideProps } from "next";
import { ClientSafeProvider, getProviders, signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "server/auth";
import { Button } from "ui/components/button";
import { BaseLayout } from "@/components/layout/base";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { NextPageWithLayout } from "../_app";

type Props = {
    providers: ClientSafeProvider[];
};

const SignIn: NextPageWithLayout<Props> = ({ providers }) => {
    return (
        <div
            className={clsx(
                "flex flex-col gap-2 sm:gap-4 text-center m-auto py-4 px-6 rounded-xl bg-light-100 dark:bg-dark-900"
            )}
        >
            <h1 className="text-3xl font-bold">Sign in</h1>
            <p className="mb-2 text-accent-700 dark:text-accent-600 sm:text-lg">
                Login or register an account to start your life on Shark Chat
            </p>
            {providers?.map((provider) => (
                <Button
                    key={provider.name}
                    onClick={() => signIn(provider.id)}
                    color="primary"
                    size="large"
                >
                    {provider.id === "github" && (
                        <GitHubLogoIcon className="w-6 h-6 mr-2" />
                    )}
                    Sign in with {provider.name}
                </Button>
            ))}
            <div className="mx-auto">
                <ThemeSwitch />
            </div>
        </div>
    );
};

SignIn.useLayout = (c) => <BaseLayout>{c}</BaseLayout>;
export const getServerSideProps: GetServerSideProps<Props> = async (
    context
) => {
    const session = await getServerSession(
        context.req,
        context.res,
        authOptions
    );

    // If the user is already logged in, redirect.
    // Note: Make sure not to redirect to the same page
    // To avoid an infinite loop!
    if (session) {
        return { redirect: { destination: "/home" }, props: { providers: [] } };
    }

    const providers = await getProviders();

    return {
        props: { providers: providers == null ? [] : Object.values(providers) },
    };
};

export default SignIn;
