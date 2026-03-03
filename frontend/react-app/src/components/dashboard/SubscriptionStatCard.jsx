import React from "react";
import DashboardStatCard from "../layout/DashboardStatCard";

const SubscriptionStatCard = ({ subscription }) => {
  const status = subscription?.status || subscription?.attributes?.status;
  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <DashboardStatCard
      title="Statut Abonnement"
      value={isActive ? "Actif" : isPending ? "En attente" : "Inactif"}
      icon="💎"
      color={isActive ? "emerald" : isPending ? "orange" : "slate"}
    />
  );
};

export default SubscriptionStatCard;
