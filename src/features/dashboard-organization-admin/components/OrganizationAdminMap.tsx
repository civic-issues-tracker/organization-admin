import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type OrganizationAdminTicket } from "../organizationAdminMockData";
import { formatStatusLabel, getPinIcon, getStatusTone } from './organizationAdminMapUtils';

type OrganizationAdminMapSite = {
  ticket?: OrganizationAdminTicket | null;
  name: string;
  lat: number;
  lng: number;
};


// Smoothly re-centers map view whenever center changes to prevent lag from full remounts
const MapRecenter = ({ location }: { location?: [number, number] | null }) => {
  const map = useMap();

  useEffect(() => {
    if (location && Array.isArray(location) && location.length === 2) {
      map.flyTo([location[0], location[1]], 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [location, map]);

  return null;
};

export default function OrganizationAdminMap({
  center,
  sites,
}: Readonly<{ center: [number, number]; sites: OrganizationAdminMapSite[] }>) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        url={
          import.meta.env.VITE_MAP_TILE_URL ||
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        maxZoom={20}
      />
      <MapRecenter location={center} />
      {sites.map((site, index) => {
        const status = site.ticket?.status ?? "submitted";
        const tone = getStatusTone(status);
        const markerKey = `${site.ticket?.id ?? site.ticket?.issueNumber ?? site.name}-${index}`;
        return (
          <Marker
            key={markerKey}
            position={[site.lat, site.lng]}
            icon={getPinIcon(tone)}
          >
            <Popup>
              <div className="min-w-64 max-w-72">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A725F]">
                  {site.name}
                </p>
                <h4 className="mt-1 text-base font-bold text-[#3A2A20]">
                  {site.ticket?.issueNumber ?? site.ticket?.id}
                </h4>
                <p className="mt-1 text-sm font-semibold text-[#5E4A3A]">
                  {site.ticket?.title ?? "Reported issue"}
                </p>
                {site.ticket?.images?.[0]?.image ? (
                  <img
                    src={site.ticket.images[0].image}
                    alt="Issue preview"
                    className="mt-3 h-28 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mt-3 flex h-28 w-full items-center justify-center rounded-lg bg-[#F3ECE4] text-xs text-[#8B7B69]">
                    No image available
                  </div>
                )}
                <div className="mt-3 space-y-1 text-xs text-[#6A5A4C]">
                  <p>
                    <span className="font-semibold text-[#8A725F]">
                      Status:
                    </span>{" "}
                    {formatStatusLabel(site.ticket?.status)}
                  </p>
                  <p>
                    <span className="font-semibold text-[#8A725F]">
                      Priority:
                    </span>{" "}
                    {site.ticket?.priority ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#8A725F]">
                      Category:
                    </span>{" "}
                    {site.ticket?.category ?? "Uncategorized"}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
