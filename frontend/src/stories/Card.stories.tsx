import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const meta = {
 title: "UI/Card",
 component: Card,
 parameters: {
 layout: "centered",
 },
 tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
 render: () => (
 <Card className="w-[350px]">
 <CardHeader>
 <CardTitle>Card Title</CardTitle>
 <CardDescription>Card description goes here</CardDescription>
 </CardHeader>
 <CardContent>
 <p>Card content with some text</p>
 </CardContent>
 <CardFooter>
 <Button>Action</Button>
 </CardFooter>
 </Card>
 ),
};

export const EventCard: Story = {
 render: () => (
 <Card className="w-[350px]">
 <CardHeader>
 <CardTitle>International Statistics Forum</CardTitle>
 <CardDescription>Annual conference on statistical methods</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 <p className="text-sm">📅 January 15-17, 2025</p>
 <p className="text-sm">📍 Riyadh, Saudi Arabia</p>
 <p className="text-sm">👥 Expected: 500+ participants</p>
 </div>
 </CardContent>
 <CardFooter className="flex justify-between">
 <Button variant="outline">Learn More</Button>
 <Button>Register</Button>
 </CardFooter>
 </Card>
 ),
};

export const BilingualCard: Story = {
 render: () => (
 <div className="flex gap-4">
 <Card className="w-[300px]">
 <CardHeader>
 <CardTitle>Organization</CardTitle>
 <CardDescription>Government Entity</CardDescription>
 </CardHeader>
 <CardContent>
 <p>General Authority for Statistics</p>
 </CardContent>
 </Card>
 <Card className="w-[300px]" dir="rtl">
 <CardHeader>
 <CardTitle>المنظمة</CardTitle>
 <CardDescription>جهة حكومية</CardDescription>
 </CardHeader>
 <CardContent>
 <p>الهيئة العامة للإحصاء</p>
 </CardContent>
 </Card>
 </div>
 ),
};