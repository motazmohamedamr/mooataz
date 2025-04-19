type Author = {
  name: string;
  job: string;
  image: string;
};

type Company = {
  name: string;
  field: string;
};

type Progress = {
  percentage: number;
};

type MockData = {
  author: Author;
  company: Company;
  progress: Progress;
};

const mockData: MockData[] = [
  {
    author: {
      name: "Alice Johnson",
      job: "Software Engineer",
      image: "http://localhost:4200/assets/media/avatars/300-1.jpg"
    },
    company: {
      name: "Tech Solutions",
      field: "Information Technology"
    },
    progress: {
      percentage: 75
    }
  },
  {
    author: {
      name: "Bob Smith",
      job: "Product Manager",
      image: "http://localhost:4200/assets/media/avatars/300-2.jpg"
    },
    company: {
      name: "Innovatech",
      field: "Consumer Electronics"
    },
    progress: {
      percentage: 60
    }
  },
  {
    author: {
      name: "Catherine Lee",
      job: "Data Scientist",
      image: "http://localhost:4200/assets/media/avatars/300-3.jpg"
    },
    company: {
      name: "Data Insights",
      field: "Data Analytics"
    },
    progress: {
      percentage: 90
    }
  },
  {
    author: {
      name: "David Wright",
      job: "UX Designer",
      image: "http://localhost:4200/assets/media/avatars/300-4.jpg"
    },
    company: {
      name: "Creative Minds",
      field: "Design"
    },
    progress: {
      percentage: 45
    }
  },
  {
    author: {
      name: "Evelyn Thompson",
      job: "Marketing Specialist",
      image: "http://localhost:4200/assets/media/avatars/300-5.jpg"
    },
    company: {
      name: "MarketReach",
      field: "Marketing"
    },
    progress: {
      percentage: 80
    }
  }
];

export { mockData, Author, Company, Progress, MockData };
