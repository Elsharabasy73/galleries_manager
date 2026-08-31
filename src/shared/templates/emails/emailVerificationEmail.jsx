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
  Link,
} from "react-email";

const EmailVerificationEmail = ({
  otp,
  expiresInMinutes = 10,
  userName,
  bannerUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCNsEYVEj6uSrL2NpBTmHf4rd7r49eK-eYI0gPSSYOzus3Fi8oevdAPylZvhqF4y0wbSv5s2O-pqW-AyG6_h1d7bofVZli7TtXwwkqbrTc5brtuzkcVzuE2_KoaLGckcga_I4ipDX3iWZtwP_-61_PGBvmoRJiIlgPwSq4A4xNBMdre2oop6q3KwJo8YMOaIzzOjlHCTqAseMZegCQwJRRALWEJLqXInJTW5r19jV93zlq7TqDwsTJ3",
}) => (
  <Html lang="en">
    <Head />

    <Preview>
      Your Atelier Gallery verification code is {otp}
    </Preview>

    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              "ivory-bg": "#FAF7F2",
              primary: "#33210D",
              "primary-container": "#4B3621",
              surface: "#FFF8F5",
              "surface-container": "#F8ECE5",
              "surface-container-highest": "#ECE0DA",
              "on-surface": "#201A17",
              "on-surface-variant": "#4E453D",
              "text-muted": "#8A8078",
              "outline-variant": "#D2C4BA",
              gold: "#C19A6B",
            },
            fontFamily: {
              sans: ["Inter", "Arial", "sans-serif"],
              display: ["Playfair Display", "Georgia", "serif"],
            },
          },
        },
      }}
    >
      <Body
        className="m-0 min-h-screen bg-[#FAF7F2] p-4 text-[#201A17]"
        style={{
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Container
          className="mx-auto w-full max-w-[600px] overflow-hidden rounded-lg bg-white"
          style={{
            boxShadow: "0 4px 20px rgba(75, 54, 33, 0.08)",
          }}
        >
          {/* =========================
              HEADER
          ========================== */}
          <Section className="border-b border-[#ECE0DA] py-8 text-center">
            <Text
              className="m-0 text-[32px] font-semibold leading-[1.2] tracking-tight text-[#33210D]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Atelier Gallery
            </Text>
          </Section>

          {/* =========================
              HERO IMAGE
          ========================== */}
          {bannerUrl && (
            <Section className="h-48 w-full overflow-hidden">
              <Img
                src={bannerUrl}
                width="600"
                height="192"
                alt="Atelier Gallery Showroom Detail"
                className="block h-48 w-full object-cover"
                style={{
                  objectFit: "cover",
                }}
              />
            </Section>
          )}

          {/* =========================
              CONTENT
          ========================== */}
          <Section className="px-8 py-10 text-center">
            <Text
              className="m-0 mb-6 text-[24px] font-semibold leading-[1.3] text-[#33210D]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Verify your email address
            </Text>

            {userName && (
              <Text className="m-0 mb-4 text-[16px] leading-6 text-[#4E453D]">
                Hello, {userName}.
              </Text>
            )}

            <Text className="mx-auto mb-10 max-w-[440px] text-[16px] leading-6 text-[#4E453D]">
              Thank you for joining Atelier Gallery. To complete your
              registration and start exploring our curated collections, please
              use the following verification code:
            </Text>

            {/* =========================
                OTP BOX
            ========================== */}
            <Section
              className="mx-auto mb-10 rounded-lg border border-[#C19A6B] bg-[#FAF7F2] px-8 py-6"
              style={{
                width: "fit-content",
              }}
            >
              <Text
                className="m-0 text-[32px] font-bold leading-none text-[#33210D]"
                style={{
                  letterSpacing: "10px",
                }}
              >
                {otp}
              </Text>
            </Section>

            {/* Expiration notice */}
            <Text className="mx-auto mb-0 max-w-[380px] text-[12px] leading-5 text-[#8A8078]">
              This code will expire in {expiresInMinutes} minutes. If you did
              not request this, please ignore this email.
            </Text>
          </Section>

          {/* =========================
              FOOTER
          ========================== */}
          <Section
            className="border-t bg-[#F8ECE5] px-8 py-8 text-center"
            style={{
              borderColor: "rgba(210, 196, 186, 0.2)",
            }}
          >
            <Text
              className="m-0 mb-4 text-[18px] font-semibold leading-6 text-[#4B3621]"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Atelier Gallery - Curating exceptional spaces.
            </Text>

            {/* Footer links */}
            <Section className="mb-6 text-center">
              <Link
                href="#"
                className="mr-6 text-[12px] font-medium leading-5 text-[#33210D] no-underline"
              >
                Support
              </Link>

              <Link
                href="#"
                className="text-[12px] font-medium leading-5 text-[#33210D] no-underline"
              >
                Privacy Policy
              </Link>
            </Section>

            {/* Social links */}
            <Section className="mb-6 text-center">
              <Link
                href="#"
                aria-label="Instagram"
                className="mx-2 text-[12px] font-medium text-[#33210D] no-underline"
              >
                Instagram
              </Link>

              <Link
                href="#"
                aria-label="Pinterest"
                className="mx-2 text-[12px] font-medium text-[#33210D] no-underline"
              >
                Pinterest
              </Link>

              <Link
                href="#"
                aria-label="Twitter"
                className="mx-2 text-[12px] font-medium text-[#33210D] no-underline"
              >
                Twitter
              </Link>
            </Section>

            {/* Copyright */}
            <Text className="m-0 text-[12px] leading-5 text-[#8A8078]">
              © 2026 Atelier Gallery. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default EmailVerificationEmail;
