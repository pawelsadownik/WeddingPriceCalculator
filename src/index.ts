export type ServiceYear = 2020 | 2021 | 2022;
export type ServiceType = "Photography" | "VideoRecording" | "BlurayPackage" | "TwoDayEvent" | "WeddingSession";

const servicePrices: Record<ServiceYear, Record<ServiceType, number>> = {
    2020: { Photography: 1700, VideoRecording: 1700, BlurayPackage: 300, TwoDayEvent: 400, WeddingSession: 600 },
    2021: { Photography: 1800, VideoRecording: 1800, BlurayPackage: 300, TwoDayEvent: 400, WeddingSession: 600 },
    2022: { Photography: 1900, VideoRecording: 1900, BlurayPackage: 300, TwoDayEvent: 400, WeddingSession: 600 }
};

const packagePrices: Record<ServiceYear, number> = {
    2020: 2200,
    2021: 2300,
    2022: 2500
};

class PriceCalculator {
    private selectedServices: Set<ServiceType>;
    private selectedYear: ServiceYear;

    constructor(selectedServices: ServiceType[], selectedYear: ServiceYear) {
        this.selectedServices = new Set(selectedServices);
        this.selectedYear = selectedYear;
    }

    private getServicePrice(service: ServiceType): number {
        return servicePrices[this.selectedYear][service];
    }

    private getPackagePrice(): number {
        return packagePrices[this.selectedYear];
    }

    private calculateBasePrice(): number {
        let basePrice = 0;

        if (this.isPackageSelected("Photography", "VideoRecording")) {
            basePrice += this.getPackagePrice();
        } else {
            if (this.selectedServices.has("Photography")) basePrice += this.getServicePrice("Photography");
            if (this.selectedServices.has("VideoRecording")) basePrice += this.getServicePrice("VideoRecording");
        }

        if (this.selectedServices.has("WeddingSession")) {
            basePrice += this.getServicePrice("WeddingSession");
        }

        if (this.selectedServices.has("BlurayPackage") && this.selectedServices.has("VideoRecording")) {
            basePrice += this.getServicePrice("BlurayPackage");
        }

        if (this.selectedServices.has("TwoDayEvent") && (this.selectedServices.has("Photography") || this.selectedServices.has("VideoRecording"))) {
            basePrice += this.getServicePrice("TwoDayEvent");
        }

        return basePrice;
    }

    private getPotentialDiscounts(): number[] {
        const discounts: number[] = [];

        if (this.selectedServices.has("WeddingSession")) {
            if (this.selectedYear === 2022 && this.selectedServices.has("Photography")) {
                discounts.push(this.getServicePrice("WeddingSession"));
            } else if (this.selectedServices.has("Photography") || this.selectedServices.has("VideoRecording")) {
                discounts.push(300);
            }
        }

        return discounts;
    }

    public calculate(): { basePrice: number, finalPrice: number } {
        const basePrice = this.calculateBasePrice();
        const potentialDiscounts = this.getPotentialDiscounts();

        const maxDiscount = Math.max(0, ...potentialDiscounts);
        const finalPrice = basePrice - maxDiscount;

        if (maxDiscount > 0 && potentialDiscounts.filter(d => d === maxDiscount).length > 1) {
            console.warn("The greatest discount was applied. Other discounts were ignored");
        }

        return { basePrice, finalPrice };
    }

    private isPackageSelected(...services: ServiceType[]): boolean {
        return services.every(service => this.selectedServices.has(service));
    }
}

export const updateSelectedServices = (
    previouslySelectedServices: ServiceType[],
    action: { type: "Select" | "Deselect"; service: ServiceType }
): ServiceType[] => {
    const updatedServices = new Set(previouslySelectedServices);

    switch (action.type) {
        case "Select":
            if (action.service === "BlurayPackage" && !updatedServices.has("VideoRecording")) {
                return previouslySelectedServices;
            }
            if (action.service === "TwoDayEvent" && !Array.from(updatedServices).some(s => s === "Photography" || s === "VideoRecording")) {
                return previouslySelectedServices;
            }
            updatedServices.add(action.service);
            break;

        case "Deselect":
            updatedServices.delete(action.service);
            if ((action.service === "Photography" || action.service === "VideoRecording") &&
                !Array.from(updatedServices).some(s => s === "Photography" || s === "VideoRecording")) {
                updatedServices.delete("BlurayPackage");
                updatedServices.delete("TwoDayEvent");
            }
            break;

        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }

    return Array.from(updatedServices);
};

export const calculatePrice = (selectedServices: ServiceType[], selectedYear: ServiceYear) => {
    const calculator = new PriceCalculator(selectedServices, selectedYear);
    return calculator.calculate();
};
