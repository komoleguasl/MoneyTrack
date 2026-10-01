export type NbuRate = {
  r030: number;
  txt: string;
  rate: number;
  cc: string;
  exchangedate: string;
};

const NBU_URL =
  'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew';

export async function getNbuRate(
  currency: string,
): Promise<NbuRate> {
  const response = await fetch(
    `${NBU_URL}?json&valcode=${currency.toUpperCase()}`,
  );

  if (!response.ok) {
    throw new Error(
      `NBU request failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as NbuRate[];

  if (!data.length) {
    throw new Error(
      `Курс для ${currency.toUpperCase()} не знайдено`,
    );
  }

  return data[0];
}

export function convertToUAH(
  amount: number,
  currency: string,
  rate: number,
) {
  if (currency === 'UAH') {
    return amount;
  }

  return amount * rate;
}
