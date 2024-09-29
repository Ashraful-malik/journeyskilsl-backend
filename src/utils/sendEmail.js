import SibApiV3Sdk from "sib-api-v3-sdk";

const sendEmail = async ({
  to,
  name,
  // subject,
  // htmlContent,
  params,
  templateId,
}) => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    let apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
    const sendSmtpEmail = {
      to: [{ email: to, name: name }],
      // sender: { email: "malikashraful874@gmail.com", name: "JourneySkill" },
      templateId: templateId,
      params: params,
      // subject: subject,
      // htmlContent: htmlContent,
    };
    const response = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
export { sendEmail };
