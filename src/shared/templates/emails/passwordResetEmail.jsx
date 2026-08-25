import React from "react";
import {
  Html,
  Head,
  Preview,
  Tailwind,
  Body,
  Container,
  Section,
  Img,
  Text,
} from "react-email";

const PasswordResetEmail = ({
  otp,
  expiresInMinutes = 60,
  userName = "there",
  bannerUrl,
}) => (
  <Html lang="en">
    <Head />
    <Preview>Your password reset code is {otp}</Preview>
    <Tailwind>
      <Body className="m-0 bg-gray-100 p-0 font-sans text-gray-800">
        <Container className="mx-auto max-w-[512px] px-4 py-10">
          <Section className="overflow-hidden rounded-lg bg-white">
            {bannerUrl && (
              <Img
                alt="Atelier Gallery Showroom Detail"
                src={bannerUrl}
                className="block h-48 w-full object-cover"
              />
            )}
            <Section className="p-8">
              <Text className="mb-4 mt-0 text-base leading-6">
                Hi {userName},
              </Text>
              <Text className="mb-6 mt-0 text-base leading-6">
                Use the code below to reset your password. This code expires in{" "}
                {expiresInMinutes} minutes.
              </Text>
              <Text className="rounded-md bg-gray-50 p-4 text-center text-[32px] font-bold leading-none tracking-[8px]">
                {otp}
              </Text>
              <Text className="mb-0 mt-6 text-sm leading-5 text-gray-500">
                If you didn't request this, you can safely ignore this email.
                Your password won't be changed.
              </Text>
              <Text className="mb-0 mt-8 text-xs leading-5 text-gray-400">
                Egypts. This is an automated message, please don't reply
                directly to this email.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default PasswordResetEmail;
